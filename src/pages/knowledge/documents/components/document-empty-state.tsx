import { FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DocumentCreationMode } from '@/api/knowledge-rest'
import { PageEmptyState } from '@/components/patterns'
import { Card } from '@/components/ui'
import { DocumentCreateMenu } from './document-create-menu'
import type { DocumentListState } from '../types'

interface DocumentEmptyStateProps {
  listState: DocumentListState
  onOpenUpload: () => void
  onOpenCreate: (
    mode: DocumentCreationMode.WEB | DocumentCreationMode.EMPTY,
  ) => void
}

export function DocumentEmptyState({
  listState,
  onOpenUpload,
  onOpenCreate,
}: DocumentEmptyStateProps) {
  const { t } = useTranslation()

  if (listState.isLoading || listState.documents.length > 0) {
    return null
  }

  return (
    <Card className="flex flex-1 items-center justify-center">
      <PageEmptyState
        title={t('knowledge.documents.emptyTitle')}
        description={t('knowledge.documents.emptyDescription')}
        icon={<FileText className="h-6 w-6" />}
        action={
          <DocumentCreateMenu
            onOpenUpload={onOpenUpload}
            onOpenCreate={onOpenCreate}
          />
        }
      />
    </Card>
  )
}
