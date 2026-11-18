import { useMemo, type FC } from 'react'
import { Download, ExternalLink, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { FileKindTile } from '@/components/patterns/file-kind-tile'
import { Button, Tooltip } from '@/components/ui'
import { previewErrorMessageKey } from '@/lib/knowledge/preview-error'
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
  const downloadLabel = canDownloadDocument
    ? t('knowledge.preview.download')
    : t('knowledge.preview.downloadDisabled')
  const openLabel = t('knowledge.preview.openInNewWindow')
  const closeLabel = t('knowledge.preview.closePreview')

  return (
    <div className="flex min-h-[var(--control-height-lg)] shrink-0 items-center justify-between gap-space-sm border-b border-line-subtle bg-surface px-space-md py-space-xs">
      <div className="flex min-w-0 flex-1 items-center gap-space-sm">
        {docName ? <FileKindTile name={docName} size="sm" /> : null}
        <Tooltip content={title}>
          <span className="truncate text-sm font-medium text-fg">{title}</span>
        </Tooltip>
      </div>
      <div className="flex shrink-0 items-center gap-space-2xs">
        <Tooltip content={downloadLabel}>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={!canDownloadDocument}
            asChild={canDownloadDocument}
            aria-label={downloadLabel}
          >
            {canDownloadDocument ? (
              <a href={documentUrl} download={docName}>
                <Download className="size-icon-sm" aria-hidden="true" />
              </a>
            ) : (
              <Download className="size-icon-sm" aria-hidden="true" />
            )}
          </Button>
        </Tooltip>
        <Tooltip content={openLabel}>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={!canUseDocumentUrl}
            asChild={canUseDocumentUrl}
            aria-label={openLabel}
          >
            {canUseDocumentUrl ? (
              <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-icon-sm" aria-hidden="true" />
              </a>
            ) : (
              <ExternalLink className="size-icon-sm" aria-hidden="true" />
            )}
          </Button>
        </Tooltip>
        {onClose && (
          <Tooltip content={closeLabel} asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label={closeLabel}
            >
              <X className="size-icon-sm" aria-hidden="true" />
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
          message={t(previewErrorMessageKey(resource.category))}
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
    <div className={cn('flex h-full flex-col bg-canvas', className)}>
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
