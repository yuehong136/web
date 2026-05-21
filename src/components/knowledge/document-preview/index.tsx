import { useMemo, type FC } from 'react'
import { Download, ExternalLink, FileText, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Tooltip } from '@/components/ui'
import { cn } from '@/lib/utils'
import { CsvPreview } from './components/csv-preview'
import { DocxPreview } from './components/docx-preview'
import { ExcelPreview } from './components/excel-preview'
import { ImagePreview } from './components/image-preview'
import { MdPreview, TxtPreview } from './components/text-preview'
import { PdfPreview } from './components/pdf-preview'
import { PptPreview } from './components/ppt-preview'
import { ErrorState, LoadingState } from './components/preview-state'
import { UnsupportedPreview } from './components/unsupported-preview'
import { VideoPreview } from './components/video-preview'
import type { DocumentPreviewProps } from './types'

const DocumentPreviewHeader: FC<{
  docName?: string
  documentUrl?: string
  onClose?: () => void
  canDownload?: boolean
}> = ({ docName, documentUrl, onClose, canDownload = false }) => {
  const { t } = useTranslation()
  const title = docName || t('knowledge.preview.documentPreview')
  const canUseDocumentUrl = Boolean(documentUrl)
  const canDownloadDocument = canDownload && canUseDocumentUrl

  return (
    <div className="flex items-center justify-between border-b border-border-default bg-background-surface px-4 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <FileText className="h-4 w-4 flex-shrink-0 text-text-secondary" />
        <Tooltip content={title}>
          <span className="truncate text-sm font-medium text-text-primary">
            {title}
          </span>
        </Tooltip>
      </div>
      <div className="flex items-center gap-0.5">
        <Tooltip
          content={
            canDownloadDocument
              ? t('knowledge.preview.download')
              : t('knowledge.preview.downloadDisabled')
          }
        >
          <Button
            variant="ghost"
            size="sm"
            disabled={!canDownloadDocument}
            asChild={canDownloadDocument}
          >
            {canDownloadDocument ? (
              <a href={documentUrl} download={docName}>
                <Download className="h-4 w-4" />
              </a>
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </Tooltip>
        <Tooltip content={t('knowledge.preview.openInNewWindow')}>
          <Button
            variant="ghost"
            size="sm"
            disabled={!canUseDocumentUrl}
            asChild={canUseDocumentUrl}
          >
            {canUseDocumentUrl ? (
              <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
          </Button>
        </Tooltip>
        {onClose && (
          <Tooltip content={t('knowledge.preview.closePreview')}>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  )
}

export const DocumentPreview: FC<DocumentPreviewProps> = ({
  resource,
  docName,
  highlights,
  className,
  onClose,
  hideHeader = false,
  canDownload = false,
}) => {
  const { t } = useTranslation()
  const documentUrl = resource.sourceUrl

  const preview = useMemo(() => {
    if (resource.kind === 'idle') {
      return <LoadingState />
    }

    if (resource.kind === 'loading') {
      return <LoadingState />
    }

    if (resource.kind === 'error') {
      return (
        <ErrorState
          title={t('knowledge.preview.loadFailed')}
          message={resource.error}
          url={resource.sourceUrl}
        />
      )
    }

    if (resource.kind === 'unsupported') {
      return (
        <UnsupportedPreview
          url={resource.sourceUrl}
          filename={docName}
          fileType={resource.fileType}
          canDownload={canDownload}
        />
      )
    }

    switch (resource.fileType) {
      case 'pdf':
        return (
          <PdfPreview
            objectUrl={resource.objectUrl}
            sourceUrl={resource.sourceUrl}
            highlights={highlights}
          />
        )
      case 'image':
        return (
          <ImagePreview
            objectUrl={resource.objectUrl}
            sourceUrl={resource.sourceUrl}
            alt={docName}
          />
        )
      case 'video':
        return (
          <VideoPreview
            objectUrl={resource.objectUrl}
            sourceUrl={resource.sourceUrl}
          />
        )
      case 'docx':
        return (
          <DocxPreview
            arrayBuffer={resource.arrayBuffer}
            sourceUrl={resource.sourceUrl}
          />
        )
      case 'xlsx':
        return (
          <ExcelPreview
            arrayBuffer={resource.arrayBuffer}
            sourceUrl={resource.sourceUrl}
          />
        )
      case 'pptx':
        return (
          <PptPreview
            arrayBuffer={resource.arrayBuffer}
            sourceUrl={resource.sourceUrl}
          />
        )
      case 'txt':
        return (
          <TxtPreview content={resource.text} sourceUrl={resource.sourceUrl} />
        )
      case 'md':
        return (
          <MdPreview content={resource.text} sourceUrl={resource.sourceUrl} />
        )
      case 'csv':
        return (
          <CsvPreview content={resource.text} sourceUrl={resource.sourceUrl} />
        )
    }
  }, [canDownload, docName, highlights, resource, t])

  return (
    <div
      className={cn('flex h-full flex-col bg-background-default', className)}
    >
      {!hideHeader && (
        <DocumentPreviewHeader
          docName={docName}
          documentUrl={documentUrl}
          onClose={onClose}
          canDownload={canDownload}
        />
      )}

      <div className="flex-1 overflow-hidden">{preview}</div>
    </div>
  )
}

export type { DocumentPreviewProps, FileType, RawHighlight } from './types'
