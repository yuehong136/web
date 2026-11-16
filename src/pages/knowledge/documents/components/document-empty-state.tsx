import { FileText, SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DocumentCreationMode } from '@/api/knowledge-rest'
import { PageEmptyState } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { DocumentCreateMenu } from './document-create-menu'

interface DocumentEmptyStateProps {
  /** Filters or a search hide every document. */
  filtered: boolean
  onClearFilters: () => void
  onOpenUpload: () => void
  onOpenCreate: (
    mode: DocumentCreationMode.WEB | DocumentCreationMode.EMPTY,
  ) => void
}

/** No documents yet (add one), or none matching the filters (clear them). */
export function DocumentEmptyState({
  filtered,
  onClearFilters,
  onOpenUpload,
  onOpenCreate,
}: DocumentEmptyStateProps) {
  const { t } = useTranslation()
  if (filtered)
    return (
      <PageEmptyState
        compact
        title={t('knowledge.documents.emptyFilteredTitle')}
        description={t('knowledge.documents.emptyFilteredDescription')}
        icon={<SearchX className="size-icon-lg" />}
        action={
          <Button variant="outline" onClick={onClearFilters}>
            {t('knowledge.documents.clearFilters')}
          </Button>
        }
      />
    )
  return (
    <PageEmptyState
      title={t('knowledge.documents.emptyTitle')}
      description={t('knowledge.documents.emptyDescription')}
      icon={<FileText className="size-icon-lg" />}
      action={
        <DocumentCreateMenu
          onOpenUpload={onOpenUpload}
          onOpenCreate={onOpenCreate}
        />
      }
    />
  )
}
