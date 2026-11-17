import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  HardDrive,
  RotateCcw,
} from 'lucide-react'
import { FileKindTile } from '@/components/patterns/file-kind-tile'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/lib/toast'
import { formatBytes } from '@/lib/utils'
import { getCurrentLanguage } from '@/locales/i18n'
import { FilledDocxPreview } from './filled-docx-preview'

interface ResultDownloadProps {
  fileData: string
  onReset: () => void
  originalFileName: string
  onBackToFill?: () => void
}

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/** Step 3: the filled document with download, preview and next steps. */
const ResultDownload: React.FC<ResultDownloadProps> = ({
  fileData,
  onReset,
  originalFileName,
  onBackToFill,
}) => {
  const { t } = useTranslation()
  const [isDownloading, setIsDownloading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [finishedAt] = useState(() => new Date())

  const downloadFile = async () => {
    try {
      setIsDownloading(true)
      const bytes = Uint8Array.from(atob(fileData), (char) =>
        char.charCodeAt(0),
      )
      const url = window.URL.createObjectURL(
        new Blob([bytes], { type: DOCX_MIME }),
      )
      const link = document.createElement('a')
      link.href = url
      const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      link.download = `${originalFileName.replace(/\.docx$/i, '')}_filled_${stamp}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success(t('aiTools.autoFill.result.downloaded'))
    } catch (error) {
      console.error(error)
      toast.error(t('aiTools.autoFill.result.downloadFailed'))
    } finally {
      setIsDownloading(false)
    }
  }

  const finishedLabel = finishedAt.toLocaleString(getCurrentLanguage(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-col items-center gap-space-sm text-center">
        <CheckCircle2
          className="size-icon-xl text-status-success"
          aria-hidden="true"
        />
        <h2 className="text-base font-semibold text-text-primary">
          {t('aiTools.autoFill.result.heading')}
        </h2>
        <p className="text-sm text-text-secondary">
          {t('aiTools.autoFill.result.description')}
        </p>
      </div>

      <div className="flex items-center gap-space-base rounded-radius-xl border border-border-subtle bg-background-surface p-space-base">
        <FileKindTile name={originalFileName} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-space-xs">
          <p className="truncate text-sm font-medium text-text-primary">
            {originalFileName}
          </p>
          <div className="flex flex-wrap items-center gap-x-space-md gap-y-space-2xs text-xs text-text-secondary">
            <span className="inline-flex items-center gap-space-xs tabular-nums">
              <HardDrive className="size-icon-xs" aria-hidden="true" />
              {formatBytes((fileData.length * 3) / 4, 1)}
            </span>
            <span className="inline-flex items-center gap-space-xs tabular-nums">
              <Clock className="size-icon-xs" aria-hidden="true" />
              {finishedLabel}
            </span>
            <span className="rounded-radius-sm bg-status-success-subtle px-space-xs text-status-success">
              {t('aiTools.autoFill.result.status')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-space-sm sm:grid-cols-2">
        <Button onClick={downloadFile} disabled={isDownloading} size="lg">
          <Download aria-hidden="true" />
          {isDownloading
            ? t('aiTools.autoFill.result.downloading')
            : t('aiTools.autoFill.result.download')}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => setShowPreview(true)}
        >
          <Eye aria-hidden="true" />
          {t('aiTools.autoFill.result.preview')}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-space-sm border-t border-border-subtle pt-space-base">
        {onBackToFill ? (
          <Button variant="ghost" size="sm" onClick={onBackToFill}>
            <ArrowLeft aria-hidden="true" />
            {t('aiTools.autoFill.result.backToEdit')}
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="ml-auto"
        >
          <RotateCcw aria-hidden="true" />
          {t('aiTools.autoFill.result.newDocument')}
        </Button>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent size="2xl" modal className="h-[85dvh]">
          <DialogHeader>
            <DialogTitle className="truncate">{originalFileName}</DialogTitle>
          </DialogHeader>
          <DialogBody className="flex flex-col px-0 pb-0">
            <FilledDocxPreview
              fileData={showPreview ? fileData : null}
              className="border-t border-border-subtle"
            />
          </DialogBody>
          <DialogFooter>
            <Button onClick={downloadFile} disabled={isDownloading}>
              <Download aria-hidden="true" />
              {t('aiTools.autoFill.result.download')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ResultDownload
