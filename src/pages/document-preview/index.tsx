import { memo, useCallback, useMemo, useState, type ReactNode } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Download } from 'lucide-react'
import { Watermark } from '@/components/ui/watermark'
import { Button, Tooltip } from '@/components/ui'
import { Spinner } from '@/components/ui/spinner'
import { DocumentPreview } from '@/components/knowledge/document-preview'
import {
  WorkbenchHeaderSlot,
  useWorkbenchHeader,
} from '@/components/layout/workbench-header'
import { FileKindTile } from '@/components/patterns/file-kind-tile'
import { PageEmptyState } from '@/components/patterns/page-states'
import { knowledgeAPI } from '@/api/knowledge'
import { documentDownloadErrorMessageKey } from '@/lib/knowledge/preview-error'
import { getPreviewErrorCategory } from '@/lib/knowledge/preview-resource'
import { toast } from '@/lib/toast'
import { getCurrentLanguage } from '@/locales/i18n'
import { useAuthStore } from '@/stores'
import { usePreviewResource } from '@/hooks/use-preview-resource'

/**
 * The page's one header row. Inside the app shell the back button, file and
 * download move into the shell header; opened on its own (a new window) the
 * row is drawn here.
 */
function PreviewHeader({
  heading,
  actions,
  bindRoot,
  title,
  action,
}: {
  heading: ReactNode
  actions: ReactNode
  bindRoot: (element: HTMLElement | null) => void
  title: ReturnType<typeof useWorkbenchHeader>
  action: ReturnType<typeof useWorkbenchHeader>
}) {
  if (title.placement === 'inline')
    return (
      <header
        ref={bindRoot}
        data-preview-header
        className="flex min-h-12 shrink-0 items-center gap-space-sm border-b border-line-subtle bg-surface px-space-md py-space-xs"
      >
        {heading}
        {actions}
      </header>
    )
  return (
    <span ref={bindRoot} hidden data-preview-header data-placement="workbench">
      <WorkbenchHeaderSlot
        placement={title.placement}
        target={title.target}
        inline={null}
      >
        <div className="flex min-w-0 flex-1 items-center gap-space-sm">
          {heading}
        </div>
      </WorkbenchHeaderSlot>
      <WorkbenchHeaderSlot
        placement={action.placement}
        target={action.target}
        inline={null}
      >
        {actions}
      </WorkbenchHeaderSlot>
    </span>
  )
}

const DocumentPreviewPage: React.FC = () => {
  const { t } = useTranslation()
  const { docId } = useParams<{ docId: string }>()
  const [searchParams] = useSearchParams()
  const [downloading, setDownloading] = useState(false)
  const user = useAuthStore((s) => s.user)
  const language = getCurrentLanguage()

  const docName = searchParams.get('name') || undefined
  const docType = searchParams.get('extension') || undefined
  const resource = usePreviewResource({ docId, docName, docType })
  const titleSlot = useWorkbenchHeader('title')
  const actionsSlot = useWorkbenchHeader('actions')
  const bindTitleRoot = titleSlot.bindRoot
  const bindActionsRoot = actionsSlot.bindRoot
  const bindRoot = useCallback(
    (element: HTMLElement | null) => {
      bindTitleRoot(element)
      bindActionsRoot(element)
    },
    [bindTitleRoot, bindActionsRoot],
  )

  const watermarkContent = useMemo(() => {
    const email = user?.email || user?.nickname || ''
    const date = new Date().toLocaleDateString(language)
    return [email, date]
  }, [user?.email, user?.nickname, language])

  const handleDownload = useCallback(async () => {
    if (!docId) return
    setDownloading(true)
    try {
      await knowledgeAPI.document.download(docId, docName || 'document')
    } catch (error) {
      // Only the failure category picks the message; backend text never shows.
      toast.error(
        t(documentDownloadErrorMessageKey(getPreviewErrorCategory(error))),
      )
    } finally {
      setDownloading(false)
    }
  }, [docId, docName, t])

  if (!docId) {
    return <PageEmptyState title={t('knowledge.preview.missingDocumentId')} />
  }

  const backLabel = t('common.back')
  const downloadLabel = t('knowledge.preview.downloadFile')
  // A name without an extension falls back to the extension parameter.
  const fileName = docName?.includes('.') ? docName : docType

  const heading = (
    <>
      <Tooltip content={backLabel} asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={backLabel}
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back()
            } else {
              window.close()
            }
          }}
        >
          <ArrowLeft className="size-icon-sm" aria-hidden="true" />
        </Button>
      </Tooltip>

      {fileName ? <FileKindTile name={fileName} size="sm" /> : null}
      <h1
        className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-fg"
        title={docName}
      >
        {docName || t('knowledge.preview.documentPreview')}
      </h1>
    </>
  )
  const actions = (
    <Tooltip content={downloadLabel} asChild>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={downloadLabel}
        aria-busy={downloading || undefined}
        onClick={handleDownload}
        disabled={downloading}
      >
        {downloading ? (
          <Spinner size="sm" />
        ) : (
          <Download className="size-icon-sm" aria-hidden="true" />
        )}
      </Button>
    </Tooltip>
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PreviewHeader
        heading={heading}
        actions={actions}
        bindRoot={bindRoot}
        title={titleSlot}
        action={actionsSlot}
      />
      <Watermark content={watermarkContent} className="min-h-0 flex-1">
        <DocumentPreview
          resource={resource}
          docName={docName}
          hideHeader
          className="h-full"
        />
      </Watermark>
    </div>
  )
}

export default memo(DocumentPreviewPage)
