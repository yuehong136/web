import type { FC, ReactNode } from 'react'
import { Download, ExternalLink, Image as ImageIcon, Video } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Tooltip } from '@/components/ui'
import type { FileType } from '../types'
import { PreviewFileMark } from './preview-state'

export const UnsupportedPreview: FC<{
  url: string
  filename?: string
  fileType: FileType
  canDownload?: boolean
}> = ({ url, filename, fileType, canDownload = false }) => {
  const { t } = useTranslation()
  // `kind` names the type tile; media without a name keep a glyph.
  const types: Record<
    FileType,
    { label: string; kind?: string; icon?: ReactNode }
  > = {
    pdf: { label: t('knowledge.preview.fileTypes.pdf'), kind: 'pdf' },
    image: {
      label: t('knowledge.preview.fileTypes.image'),
      icon: <ImageIcon />,
    },
    video: { label: t('knowledge.preview.fileTypes.video'), icon: <Video /> },
    docx: { label: t('knowledge.preview.fileTypes.docx'), kind: 'docx' },
    xlsx: { label: t('knowledge.preview.fileTypes.xlsx'), kind: 'xlsx' },
    pptx: { label: 'PowerPoint', kind: 'pptx' },
    txt: { label: t('knowledge.preview.fileTypes.txt'), kind: 'txt' },
    md: { label: 'Markdown', kind: 'md' },
    csv: { label: t('knowledge.preview.fileTypes.csv'), kind: 'csv' },
    unknown: { label: t('knowledge.preview.fileTypes.unknown') },
  }

  const { label, kind, icon } = types[fileType] || types.unknown
  // A real file name shows its own extension (ZIP, RAR…) on the tile.
  const tileName = filename?.includes('.') ? filename : kind

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-space-md bg-background-subtle p-space-xl text-center">
      <PreviewFileMark name={tileName} icon={icon} />
      <div className="flex max-w-sm flex-col gap-space-xs">
        <h3 className="text-base font-medium text-text-primary">{label}</h3>
        <p className="text-sm text-text-secondary">
          {canDownload
            ? t('knowledge.preview.unsupportedWithDownload')
            : t('knowledge.preview.unsupported')}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-space-sm">
        <Button variant="outline" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-icon-sm" aria-hidden="true" />
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
                <Download className="size-icon-sm" aria-hidden="true" />
                {t('knowledge.preview.downloadFile')}
              </a>
            ) : (
              <>
                <Download className="size-icon-sm" aria-hidden="true" />
                {t('knowledge.preview.downloadFile')}
              </>
            )}
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}
