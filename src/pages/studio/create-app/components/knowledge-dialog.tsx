import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import { KnowledgeBaseAvatar } from '@/components/knowledge'
import {
  PageLoadingState,
  PageErrorState,
  PageEmptyState,
} from '@/components/patterns'
import { KNOWLEDGE_PAGE_SIZE } from '../constants'
import type { CreateAppPageController } from '../hooks/use-create-app-page'

type KnowledgeBindings = Pick<
  CreateAppPageController,
  | 'showKnowledgeModal'
  | 'setShowKnowledgeModal'
  | 'availableKnowledgeBases'
  | 'knowledgeSearch'
  | 'setKnowledgeSearch'
  | 'knowledgePage'
  | 'knowledgeTotal'
  | 'addedKnowledgeBases'
  | 'selectedEmbdId'
  | 'handleAddKnowledgeBase'
  | 'handleKnowledgeSearch'
  | 'handleKnowledgePageChange'
  | 'knowledgeLoading'
  | 'knowledgeError'
  | 'retryKnowledge'
>
export function KnowledgeDialog({
  controller,
}: {
  controller: KnowledgeBindings
}) {
  const {
    showKnowledgeModal,
    setShowKnowledgeModal,
    availableKnowledgeBases,
    knowledgeSearch,
    setKnowledgeSearch,
    knowledgePage,
    knowledgeTotal,
    addedKnowledgeBases,
    selectedEmbdId,
    handleAddKnowledgeBase,
    handleKnowledgeSearch,
    handleKnowledgePageChange,
    knowledgeLoading,
    knowledgeError,
    retryKnowledge,
  } = controller
  const { t } = useTranslation()
  return (
    <Dialog open={showKnowledgeModal} onOpenChange={setShowKnowledgeModal}>
      <DialogContent size="lg" modal>
        <DialogHeader>
          <DialogTitle>{t('studio.editor.addKnowledge')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-space-base p-space-lg">
          <form
            className="flex gap-space-sm"
            onSubmit={(event) => {
              event.preventDefault()
              handleKnowledgeSearch()
            }}
          >
            <Input
              aria-label={t('studio.editor.searchKnowledge')}
              placeholder={t('studio.editor.searchKnowledge')}
              value={knowledgeSearch}
              onChange={(event) => setKnowledgeSearch(event.target.value)}
            />
            <Button type="submit">{t('studio.editor.search')}</Button>
          </form>
          <div className="max-h-80 space-y-space-sm overflow-y-auto">
            {knowledgeLoading ? (
              <PageLoadingState
                compact
                title={t('studio.editor.loading')}
                description=""
              />
            ) : knowledgeError ? (
              <PageErrorState
                compact
                title={t('studio.editor.knowledgeFailed')}
                retryLabel={t('studio.editor.retryLoad')}
                onRetry={() => {
                  void retryKnowledge()
                }}
              />
            ) : !availableKnowledgeBases.length ? (
              <PageEmptyState compact title={t('studio.editor.noResults')} />
            ) : (
              availableKnowledgeBases.map((kb) => {
                const added = addedKnowledgeBases.has(kb.id)
                const incompatible =
                  selectedEmbdId !== '' && kb.embd_id !== selectedEmbdId
                return (
                  <div
                    key={kb.id}
                    className="flex min-w-0 items-center gap-space-sm border-b border-border-subtle py-space-sm"
                  >
                    <KnowledgeBaseAvatar
                      name={kb.name}
                      avatar={kb.avatar}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-medium"
                        title={kb.name}
                      >
                        {kb.name}
                      </p>
                      <p
                        className="truncate text-xs text-text-secondary"
                        title={kb.embd_id}
                      >
                        {kb.embd_id}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {t('studio.editor.documents')}: {kb.doc_num ?? 0} ·{' '}
                        {t('studio.editor.chunks')}: {kb.chunk_num ?? 0}
                      </p>
                    </div>
                    <Button
                      className="max-w-24 whitespace-normal"
                      size="sm"
                      variant="outline"
                      disabled={added || incompatible}
                      title={
                        incompatible
                          ? t('studio.editor.incompatible')
                          : undefined
                      }
                      onClick={() => handleAddKnowledgeBase(kb)}
                    >
                      {t(
                        `studio.editor.${added ? 'added' : incompatible ? 'incompatible' : 'add'}`,
                      )}
                    </Button>
                  </div>
                )
              })
            )}
          </div>
          {knowledgeTotal > KNOWLEDGE_PAGE_SIZE && (
            <Pagination
              current={knowledgePage}
              total={knowledgeTotal}
              pageSize={KNOWLEDGE_PAGE_SIZE}
              onChange={handleKnowledgePageChange}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
