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
import { UnsupportedPreview } from './components/unsupported-preview'
import { VideoPreview } from './components/video-preview'
import type { DocumentPreviewProps } from './types'
import { getDocumentUrl, getFileType } from './utils'

const DocumentPreviewHeader: FC<{
  docName?: string
  documentUrl: string
  onClose?: () => void
  canDownload?: boolean
}> = ({ docName, documentUrl, onClose, canDownload = false }) => {
  const { t } = useTranslation()
  const title = docName || t('knowledge.preview.documentPreview')

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
            canDownload
              ? t('knowledge.preview.download')
              : t('knowledge.preview.downloadDisabled')
          }
        >
          <Button
            variant="ghost"
            size="sm"
            disabled={!canDownload}
            asChild={canDownload}
          >
            {canDownload ? (
              <a href={documentUrl} download={docName}>
                <Download className="h-4 w-4" />
              </a>
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </Tooltip>
        <Tooltip content={t('knowledge.preview.openInNewWindow')}>
          <Button variant="ghost" size="sm" asChild>
            <a href={documentUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
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
  docId,
  docName,
  docType,
  highlights,
  className,
  onClose,
  hideHeader = false,
  canDownload = false,
}) => {
  const fileType = useMemo(
    () => getFileType(docName, docType),
    [docName, docType],
  )
  const documentUrl = useMemo(() => getDocumentUrl(docId), [docId])

  const preview = useMemo(() => {
    switch (fileType) {
      case 'pdf':
        return <PdfPreview url={documentUrl} highlights={highlights} />
      case 'image':
        return <ImagePreview url={documentUrl} alt={docName} />
      case 'video':
        return <VideoPreview url={documentUrl} />
      case 'docx':
        return <DocxPreview url={documentUrl} />
      case 'xlsx':
        return <ExcelPreview url={documentUrl} />
      case 'pptx':
        return <PptPreview url={documentUrl} />
      case 'txt':
        return <TxtPreview url={documentUrl} />
      case 'md':
        return <MdPreview url={documentUrl} />
      case 'csv':
        return <CsvPreview url={documentUrl} />
      default:
        return (
          <UnsupportedPreview
            url={documentUrl}
            filename={docName}
            fileType={fileType}
            canDownload={canDownload}
          />
        )
    }
  }, [canDownload, docName, documentUrl, fileType, highlights])

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
