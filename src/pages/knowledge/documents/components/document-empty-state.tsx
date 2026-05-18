import { FileText, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageEmptyState } from '@/components/patterns'
import { Button, Card } from '@/components/ui'
import type { DocumentListState } from '../types'

interface DocumentEmptyStateProps {
  listState: DocumentListState
  onOpenUpload: () => void
}

export function DocumentEmptyState({
  listState,
  onOpenUpload,
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
          <Button onClick={onOpenUpload}>
            <Plus className="mr-2 h-4 w-4" />
            {t('knowledge.documents.addDocument')}
          </Button>
        }
      />
    </Card>
  )
}
