import type { FC } from 'react'
import {
  ArrowUpDown,
  Database,
  Grid3X3,
  List as ListIcon,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomSelect } from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'
import { ViewToggle } from '@/components/ui/view-toggle'
import { KnowledgeListView } from '@/components/knowledge'
import { ListPageTemplate } from '@/components/page-templates'
import { PageEmptyState } from '@/components/patterns/page-states'
import { CreateKnowledgeModal } from './components/CreateKnowledgeModal'
import { KnowledgeCard } from './list/knowledge-card'
import { KnowledgeListPagination } from './list/knowledge-list-pagination'
import { KnowledgeListStats } from './list/knowledge-list-stats'
import { KnowledgeQuickEditDialog } from './list/quick-edit-modal'
import { useKnowledgeListPage } from './list/use-knowledge-list-page'

export const KnowledgeListPage: FC = () => {
  const page = useKnowledgeListPage()

  const emptyState = (
    <PageEmptyState
      action={
        !page.hasActiveSearch ? (
          <Button onClick={() => page.setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            {page.t('knowledge.list.actions.create')}
          </Button>
        ) : undefined
      }
      description={
        page.hasActiveSearch
          ? page.t('knowledge.list.empty.filteredDescription')
          : page.t('knowledge.list.empty.description')
      }
      icon={<Database className="h-6 w-6" />}
      title={
        page.hasActiveSearch
          ? page.t('knowledge.list.empty.filteredTitle')
          : page.t('knowledge.list.empty.title')
      }
    />
  )

  const toolbarRight = (
    <>
      <CustomSelect
        className="min-w-[110px]"
        onChange={(value) =>
          page.setTimeFormat(value as typeof page.timeFormat)
        }
        options={page.timeFormatOptions}
        size="sm"
        value={page.timeFormat}
      />

      <Button
        className="px-space-sm h-9 text-xs"
        onClick={() => page.setSortDesc((prev) => !prev)}
        size="sm"
        variant="outline"
      >
        <ArrowUpDown className="h-3.5 w-3.5" />
        {page.sortDesc
          ? page.t('knowledge.list.sort.desc')
          : page.t('knowledge.list.sort.asc')}
      </Button>

      <ViewToggle
        onChange={page.setViewMode}
        options={[
          {
            icon: <Grid3X3 />,
            label: page.t('knowledge.list.view.grid'),
            value: 'grid',
          },
          {
            icon: <ListIcon />,
            label: page.t('knowledge.list.view.table'),
            value: 'table',
          },
        ]}
        size="md"
        value={page.viewMode}
      />
    </>
  )

  const content =
    page.viewMode === 'grid' ? (
      <div className="gap-space-base grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {page.knowledgeBases.map((knowledgeBase) => (
          <KnowledgeCard
            formatTime={page.formatTime}
            getStatusClassName={page.getStatusClassName}
            getStatusText={page.getStatusText}
            key={knowledgeBase.id}
            knowledgeBase={knowledgeBase}
            onClick={() => page.handleView(knowledgeBase.id)}
            onDelete={() => void page.handleDelete(knowledgeBase.id)}
            onSelect={(checked) =>
              page.toggleGridSelection(knowledgeBase.id, checked)
            }
            onSettings={() => page.setEditingKnowledgeBase(knowledgeBase)}
            selected={page.selectedBases.includes(knowledgeBase.id)}
          />
        ))}
      </div>
    ) : (
      <KnowledgeListView
        data={page.knowledgeBases}
        getStatusColor={page.getStatusClassName}
        getStatusText={page.getStatusText}
        isLoading={page.isLoading}
        onDelete={(knowledgeBase) => void page.handleDelete(knowledgeBase.id)}
        onEdit={page.setEditingKnowledgeBase}
        onSelect={page.toggleSelectedBase}
        onSelectAll={page.toggleSelectAll}
        selectedIds={page.selectedBases}
        timeFormat={page.timeFormat}
      />
    )

  return (
    <>
      <ListPageTemplate
        description={page.t('knowledge.list.description')}
        emptyState={emptyState}
        headerActions={
          <>
            {page.selectedBases.length > 0 ? (
              <Button
                onClick={() => void page.handleBulkDelete()}
                size="sm"
                variant="destructive"
              >
                <Trash2 className="h-4 w-4" />
                {page.t('knowledge.list.actions.deleteSelected', {
                  count: page.selectedBases.length,
                })}
              </Button>
            ) : null}
            <Button onClick={() => page.setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              {page.t('knowledge.list.actions.create')}
            </Button>
          </>
        }
        loadingState={<Loading size="lg" variant="spinner" />}
        pagination={
          <KnowledgeListPagination
            currentPage={page.currentPage}
            onPageChange={page.setCurrentPage}
            onPageSizeChange={(pageSize) => {
              page.setPageSize(pageSize)
              page.setCurrentPage(1)
            }}
            pageSize={page.pageSize}
            selectedCount={page.selectedBases.length}
            total={page.total}
            totalPages={page.totalPages}
          />
        }
        state={
          page.isLoading
            ? 'loading'
            : page.knowledgeBases.length === 0
              ? 'empty'
              : 'content'
        }
        stats={
          <KnowledgeListStats
            knowledgeBases={page.knowledgeBases}
            total={page.total}
          />
        }
        title={page.t('knowledge.list.title')}
        toolbarLeft={
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            onChange={(event) => page.setSearchQuery(event.target.value)}
            placeholder={page.t('knowledge.list.searchPlaceholder')}
            type="search"
            value={page.searchQuery}
          />
        }
        toolbarRight={toolbarRight}
      >
        {content}
      </ListPageTemplate>

      {page.editingKnowledgeBase ? (
        <KnowledgeQuickEditDialog
          open
          knowledgeBase={page.editingKnowledgeBase}
          submitting={page.isQuickEditSubmitting}
          onClose={() => page.setEditingKnowledgeBase(null)}
          onSubmit={page.handleQuickEditSubmit}
        />
      ) : null}

      <CreateKnowledgeModal
        onClose={() => page.setShowCreateModal(false)}
        onSuccess={page.handleCreateSuccess}
        open={page.showCreateModal}
      />
    </>
  )
}
