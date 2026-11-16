import { useState, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Files in a drop, skipping folders (the upload dialog takes those). */
export function droppedFiles(event: DragEvent): File[] {
  const items = [...event.dataTransfer.items]
  if (!items.length) return [...event.dataTransfer.files]
  return items
    .filter(
      (item) =>
        item.kind === 'file' && item.webkitGetAsEntry?.()?.isDirectory !== true,
    )
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null)
}

const carriesFiles = (event: DragEvent) =>
  [...event.dataTransfer.types].includes('Files')

interface DocumentDropHintProps {
  /** Opens the upload dialog, with the dropped files when there are any. */
  onUpload: (files?: File[]) => void
  disabled?: boolean
}

/**
 * The "drop files here" strip above the documents: a button that opens the
 * upload dialog, and a drop target that opens it with the dropped files.
 */
export function DocumentDropHint({
  onUpload,
  disabled = false,
}: DocumentDropHintProps) {
  const { t } = useTranslation()
  const [over, setOver] = useState(false)

  return (
    <button
      type="button"
      data-slot="document-drop-hint"
      data-drag-over={over || undefined}
      disabled={disabled}
      onClick={() => onUpload()}
      onDragEnter={(event) => {
        if (!carriesFiles(event)) return
        event.preventDefault()
        setOver(true)
      }}
      onDragOver={(event) => {
        if (!carriesFiles(event)) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        if (!carriesFiles(event)) return
        event.preventDefault()
        setOver(false)
        const files = droppedFiles(event)
        if (files.length) onUpload(files)
      }}
      className={cn(
        'mx-space-md mb-space-sm hidden shrink-0 items-center gap-space-sm rounded-radius-lg border border-dashed px-space-base py-space-sm text-left text-sm text-text-secondary outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-state-focus disabled:pointer-events-none disabled:opacity-50 sm:flex',
        over
          ? 'border-state-focus bg-state-focus-subtle'
          : 'border-state-focus-subtle bg-state-focus-10 hover:border-state-focus',
      )}
    >
      <Upload className="size-icon-md shrink-0 text-text-accent" aria-hidden />
      <span className="min-w-0 truncate">
        {over
          ? t('knowledge.documents.dropHint.release')
          : t('knowledge.documents.dropHint.idle')}
      </span>
      <span className="hidden min-w-0 truncate text-xs text-text-tertiary lg:inline">
        {t('knowledge.documents.dropHint.formats')}
      </span>
    </button>
  )
}
