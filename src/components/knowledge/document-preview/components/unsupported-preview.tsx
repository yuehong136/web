import type { FC, ReactNode } from 'react'
import {
  Download,
  ExternalLink,
  FileCode,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Presentation,
  Video,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Tooltip } from '@/components/ui'
import type { FileType } from '../types'

export const UnsupportedPreview: FC<{
  url: string
  filename?: string
  fileType: FileType
  canDownload?: boolean
}> = ({ url, filename, fileType, canDownload = false }) => {
  const { t } = useTranslation()
  const typeLabels: Record<FileType, { label: string; icon: ReactNode }> = {
    pdf: {
      label: t('knowledge.preview.fileTypes.pdf'),
      icon: <FileText className="h-16 w-16" />,
    },
    image: {
      label: t('knowledge.preview.fileTypes.image'),
      icon: <ImageIcon className="h-16 w-16" />,
    },
    video: {
      label: t('knowledge.preview.fileTypes.video'),
      icon: <Video className="h-16 w-16" />,
    },
    docx: {
      label: t('knowledge.preview.fileTypes.docx'),
      icon: <FileText className="h-16 w-16" />,
    },
    xlsx: {
      label: t('knowledge.preview.fileTypes.xlsx'),
      icon: <FileSpreadsheet className="h-16 w-16" />,
    },
    pptx: {
      label: 'PowerPoint',
      icon: <Presentation className="h-16 w-16" />,
    },
    txt: {
      label: t('knowledge.preview.fileTypes.txt'),
      icon: <FileCode className="h-16 w-16" />,
    },
    md: { label: 'Markdown', icon: <FileCode className="h-16 w-16" /> },
    csv: {
      label: t('knowledge.preview.fileTypes.csv'),
      icon: <FileSpreadsheet className="h-16 w-16" />,
    },
    unknown: {
      label: t('knowledge.preview.fileTypes.unknown'),
      icon: <FileText className="h-16 w-16" />,
    },
  }

  const { label, icon } = typeLabels[fileType] || typeLabels.unknown

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-background-subtle p-8">
      <div className="mb-6 text-text-muted">{icon}</div>
      <h3 className="mb-2 text-lg font-medium text-text-primary">{label}</h3>
      <p className="mb-8 max-w-sm text-center text-sm text-text-secondary">
        {canDownload
          ? t('knowledge.preview.unsupportedWithDownload')
          : t('knowledge.preview.unsupported')}
      </p>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            {t('knowledge.preview.openInNewWindow')}
          </a>
        </Button>
        <Tooltip
          content={
            canDownload ? undefined : t('knowledge.preview.downloadDisabled')
          }
        >
          <Button disabled={!canDownload} asChild={canDownload}>
            {canDownload ? (
              <a href={url} download={filename}>
                <Download className="mr-2 h-4 w-4" />
                {t('knowledge.preview.downloadFile')}
              </a>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {t('knowledge.preview.downloadFile')}
              </>
            )}
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}
