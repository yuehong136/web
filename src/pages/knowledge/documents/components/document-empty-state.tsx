import { Globe2, Plug, SearchX, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DocumentCreationMode } from '@/api/knowledge-rest'
import { PageEmptyState } from '@/components/patterns'
import {
  EmptyStart,
  FileStackIllustration,
} from '@/components/patterns/empty-start'
import { Button } from '@/components/ui/button'

interface DocumentEmptyStateProps {
  /** Filters or a search hide every document. */
  filtered: boolean
  onClearFilters: () => void
  onOpenUpload: () => void
  onOpenCreate: (
    mode: DocumentCreationMode.WEB | DocumentCreationMode.EMPTY,
  ) => void
  /** The base's settings, where a data source is linked. */
  onLinkDataSource: () => void
}

/**
 * No documents yet: the ways to add one as start paths (upload, a webpage,
 * a linked data source; a blank document stays in the header's add menu).
 * With filters, a clear action.
 */
export function DocumentEmptyState({
  filtered,
  onClearFilters,
  onOpenUpload,
  onOpenCreate,
  onLinkDataSource,
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
    <EmptyStart
      ghost={false}
      illustration={<FileStackIllustration />}
      title={t('knowledge.documents.emptyTitle')}
      description={t('knowledge.documents.emptyDescription')}
      paths={[
        {
          key: 'upload',
          primary: true,
          icon: <Upload aria-hidden="true" />,
          iconClassName:
            'bg-components-avatar-6-bg text-components-avatar-6-text',
          title: t('documentCreate.uploadFile'),
          description: t('knowledge.documents.emptyStart.uploadDescription'),
          cta: t('knowledge.documents.emptyStart.uploadCta'),
          onSelect: onOpenUpload,
        },
        {
          key: 'web',
          icon: <Globe2 aria-hidden="true" />,
          iconClassName:
            'bg-components-avatar-8-bg text-components-avatar-8-text',
          title: t('documentCreate.fromWeb'),
          description: t('knowledge.documents.emptyStart.webDescription'),
          cta: t('knowledge.documents.emptyStart.webCta'),
          onSelect: () => onOpenCreate(DocumentCreationMode.WEB),
        },
        {
          key: 'source',
          icon: <Plug aria-hidden="true" />,
          iconClassName:
            'bg-components-avatar-7-bg text-components-avatar-7-text',
          title: t('knowledge.documents.emptyStart.sourceTitle'),
          description: t('knowledge.documents.emptyStart.sourceDescription'),
          cta: t('knowledge.documents.emptyStart.sourceCta'),
          onSelect: onLinkDataSource,
        },
      ]}
    />
  )
}
