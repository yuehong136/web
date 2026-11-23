import type { FC } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CollectionTemplate } from '@/components/page-templates'
import {
  BulkActionBar,
  InlineStats,
  PageEmptyState,
  PageErrorState,
  CollectionSkeleton,
  Pager,
} from '@/components/patterns'
import { PAGE_SIZE_OPTIONS } from './list/constants'
import { KnowledgeCollection } from './list/knowledge-collection'
import { KnowledgeEmptyStart } from './list/knowledge-empty-start'
import { KnowledgeListFilterBar } from './list/knowledge-list-filter-bar'
import { KnowledgeQuickEditDialog } from './list/quick-edit-modal'
import {
  knowledgePaths,
  useKnowledgeListPage,
} from './list/use-knowledge-list-page'
import { getKnowledgePageStats } from './list/utils'

export const KnowledgeListPage: FC = () => {
  const page = useKnowledgeListPage()
  const { t } = page
  const pageStats = getKnowledgePageStats(page.knowledgeBases)
  const state = page.isError
    ? 'error'
    : page.isLoading && page.knowledgeBases.length === 0
      ? 'loading'
      : page.knowledgeBases.length === 0
        ? 'empty'
        : 'content'
  const firstUse = state === 'empty' && !page.hasActiveSearch
  const createButton = (
    <Button onClick={page.openCreate}>
      <Plus className="size-icon-sm" aria-hidden="true" />
      {t('knowledge.list.actions.create')}
    </Button>
  )

  return (
    <>
      <CollectionTemplate
        title={t('knowledge.list.title')}
        count={page.total}
        countLabel={t('knowledge.list.results', { count: page.total })}
        description={firstUse ? t('knowledge.list.empty.title') : undefined}
        actions={firstUse ? null : createButton}
        filterBar={
          firstUse ? null : (
            <KnowledgeListFilterBar
              search={page.searchQuery}
              onSearchChange={page.setSearchQuery}
              sortDescending={page.sortDesc}
              onSortDescendingChange={page.setSortDesc}
              groupBy={page.groupBy}
              onGroupByChange={page.setGroupBy}
              timeFormat={page.timeFormat}
              onTimeFormatChange={page.setTimeFormat}
              view={page.viewMode}
              onViewChange={page.setViewMode}
            />
          )
        }
        state={state}
        refreshing={page.isFetching && !page.isLoading}
        loadingState={
          <CollectionSkeleton
            view={page.viewMode === 'list' ? 'list' : 'grid'}
            label={t('knowledge.list.loadingTitle')}
          />
        }
        errorState={
          <PageErrorState
            title={t('knowledge.list.errorTitle')}
            description={t('knowledge.list.errorDescription')}
            retryLabel={t('knowledge.common.retry')}
            onRetry={() => {
              void page.refetch()
            }}
          />
        }
        emptyState={
          page.hasActiveSearch ? (
            <PageEmptyState
              icon={<Search className="size-icon-lg" />}
              title={t('knowledge.list.empty.filteredTitle')}
              description={t('knowledge.list.empty.filteredDescription')}
              action={
                <Button
                  variant="outline"
                  onClick={() => page.setSearchQuery('')}
                >
                  {t('knowledge.list.empty.clearSearch')}
                </Button>
              }
            />
          ) : (
            <KnowledgeEmptyStart
              onCreate={page.openCreate}
              onConnectSource={page.openDataSources}
            />
          )
        }
        footerNote={
          <InlineStats
            data-slot="knowledge-page-stats"
            aria-label={t('knowledge.list.pageStats.label')}
            items={[
              {
                key: 'knowledgeBases',
                label: t('knowledge.list.pageStats.knowledgeBases'),
                value: pageStats.knowledgeBases.toLocaleString(),
              },
              {
                key: 'documents',
                label: t('knowledge.list.pageStats.documents'),
                value: pageStats.documents.toLocaleString(),
              },
              {
                key: 'chunks',
                label: t('knowledge.list.pageStats.chunks'),
                value: pageStats.chunks.toLocaleString(),
              },
            ]}
          />
        }
        footer={
          <Pager
            page={page.currentPage}
            pageSize={page.pageSize}
            total={page.total}
            onPageChange={page.setCurrentPage}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={page.setPageSize}
          />
        }
        bulkActions={
          page.selectedIds.length ? (
            <BulkActionBar
              count={page.selectedIds.length}
              onClear={() => page.setSelectedIds([])}
            >
              <Button
                variant="ghost"
                size="sm"
                className="text-danger-fg"
                disabled={page.deleting}
                onClick={() =>
                  page.requestDelete({ ids: [...page.selectedIds] })
                }
              >
                <Trash2 className="size-icon-sm" aria-hidden="true" />
                {t('knowledge.list.actions.delete')}
              </Button>
            </BulkActionBar>
          ) : null
        }
      >
        <KnowledgeCollection
          knowledgeBases={page.knowledgeBases}
          viewMode={page.viewMode}
          groupBy={page.groupBy}
          timeFormat={page.timeFormat}
          selectedIds={page.selectedIds}
          onToggleSelected={page.toggleSelected}
          onTogglePage={page.togglePage}
          onCreate={page.openCreate}
          handlers={{
            onOpen: (knowledgeBase) =>
              page.navigate(knowledgePaths.documents(knowledgeBase.id)),
            onImport: (knowledgeBase) =>
              page.navigate(knowledgePaths.importDocuments(knowledgeBase.id)),
            onSearch: (knowledgeBase) =>
              page.navigate(knowledgePaths.search(knowledgeBase.id)),
            onEdit: page.setEditingKnowledgeBase,
            onSettings: (knowledgeBase) =>
              page.navigate(knowledgePaths.settings(knowledgeBase.id)),
            onDelete: (knowledgeBase) =>
              page.requestDelete({
                ids: [knowledgeBase.id],
                name: knowledgeBase.name,
              }),
          }}
        />
      </CollectionTemplate>

      {page.editingKnowledgeBase ? (
        <KnowledgeQuickEditDialog
          open
          knowledgeBase={page.editingKnowledgeBase}
          submitting={page.isQuickEditSubmitting}
          onClose={() => page.setEditingKnowledgeBase(null)}
          onSubmit={page.handleQuickEditSubmit}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(page.deletion)}
        onOpenChange={(open) => {
          if (!open) page.cancelDelete()
        }}
        variant="destructive"
        pending={page.deleting}
        title={t('knowledge.list.deleteDialog.title')}
        description={
          page.deletion?.name
            ? t('knowledge.list.deleteDialog.namedDescription', {
                name: page.deletion.name,
              })
            : t('knowledge.list.deleteDialog.bulkDescription', {
                count: page.deletion?.ids.length ?? 0,
              })
        }
        cancelLabel={t('knowledge.common.cancel')}
        confirmLabel={t('knowledge.list.actions.delete')}
        onConfirm={() => void page.confirmDelete()}
      />
    </>
  )
}
