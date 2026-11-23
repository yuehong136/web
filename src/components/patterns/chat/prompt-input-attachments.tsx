import { useRef, type ReactNode } from 'react'
import { Plus, RotateCcw, Upload, X } from 'lucide-react'
import { FileKindTile } from '@/components/patterns/file-kind-tile'
import { Button } from '@/components/ui/button'
import type { UploadFile } from '@/config/chat'
import { cn } from '@/lib/utils'

export interface PromptInputAttachmentsLabels {
  title: string
  close: string
  /** The empty tray's call to action, and the "add more" button. */
  pick: string
  /** The empty tray while files are dragged over the page. */
  release: string
  /** Count and size limits under the call to action. */
  limits: string
  remove: (name: string) => string
  retry: (name: string) => string
}

export interface PromptInputAttachmentsProps {
  files: UploadFile[]
  /** One status line per file: progress, ready (type, size) or failed. */
  describe: (file: UploadFile) => string
  labels: PromptInputAttachmentsLabels
  maxCount: number
  /** Called once per picked file; the caller checks size and uploads. */
  onUpload: (file: File) => void
  onRemove: (uid: string) => void
  onRetry?: (uid: string) => void
  onClose: () => void
  /** Files are being dragged over the page: the tray invites the drop. */
  dragging?: boolean
  /** Extra content after the files, e.g. a hint. */
  footer?: ReactNode
  className?: string
}

function FileText({
  name,
  status,
  failed,
}: {
  name: string
  status: string
  failed: boolean
}) {
  return (
    <>
      <span className="block truncate text-sm text-fg">{name}</span>
      <span
        className={cn(
          'block truncate text-xs',
          failed ? 'text-danger-fg' : 'text-fg-subtle',
        )}
      >
        {status}
      </span>
    </>
  )
}

/**
 * The attachment tray inside a prompt input: pick, drop or paste files; each
 * file shows its kind, name and upload status and can be retried or removed.
 * Requests and file state belong to the caller.
 */
export function PromptInputAttachments({
  files,
  describe,
  labels,
  maxCount,
  onUpload,
  onRemove,
  onRetry,
  onClose,
  dragging = false,
  footer,
  className,
}: PromptInputAttachmentsProps) {
  const picker = useRef<HTMLInputElement>(null)
  const room = Math.max(0, maxCount - files.length)
  const pick = () => picker.current?.click()
  return (
    <section
      aria-label={labels.title}
      data-prompt-attachments
      data-dragging={dragging || undefined}
      className={cn(
        'rounded-radius-lg border border-line-subtle bg-sunken transition-colors duration-(--motion-fast) motion-reduce:transition-none',
        dragging && 'border-line-focus bg-accent-soft',
        className,
      )}
    >
      <header className="flex items-center gap-space-sm border-b border-line-subtle px-space-base py-space-xs">
        <Upload aria-hidden="true" className="size-icon-sm text-accent-fg" />
        <span className="flex-1 text-sm font-medium text-fg">
          {labels.title}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={labels.close}
          onClick={onClose}
        >
          <X aria-hidden="true" className="size-icon-sm" />
        </Button>
      </header>
      {files.length > 0 ? (
        <ul className="scrollbar-none flex items-center gap-space-md overflow-x-auto px-space-base py-space-base">
          {files.map((file) => {
            const failed = file.status === 'error'
            return (
              <li
                key={file.uid}
                data-status={file.status}
                className="relative flex w-64 shrink-0 items-center gap-space-sm rounded-radius-md border border-line-subtle bg-surface py-space-sm ps-space-sm pe-space-2xs"
              >
                <FileKindTile
                  name={file.response?.name ?? file.name}
                  size="lg"
                />
                {failed && onRetry ? (
                  // A failed file retries from anywhere on its text, too.
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => onRetry(file.uid)}
                    className="min-w-0 flex-1 cursor-pointer text-start outline-hidden"
                  >
                    <FileText name={file.name} status={describe(file)} failed />
                  </button>
                ) : (
                  <span className="min-w-0 flex-1">
                    <FileText
                      name={file.name}
                      status={describe(file)}
                      failed={failed}
                    />
                  </span>
                )}
                {file.status === 'uploading' && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-space-sm bottom-0 h-0.5 overflow-hidden rounded-radius-full bg-line-subtle"
                  >
                    <span
                      className="block h-full bg-line-focus transition-[width] duration-(--motion-fast) motion-reduce:transition-none"
                      style={{ width: `${Math.round(file.percent ?? 0)}%` }}
                    />
                  </span>
                )}
                <span className="flex shrink-0 self-start">
                  {failed && onRetry && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={labels.retry(file.name)}
                      onClick={() => onRetry(file.uid)}
                    >
                      <RotateCcw aria-hidden="true" className="size-icon-sm" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={labels.remove(file.name)}
                    onClick={() => onRemove(file.uid)}
                  >
                    <X aria-hidden="true" className="size-icon-sm" />
                  </Button>
                </span>
              </li>
            )
          })}
          {room > 0 && (
            <li className="shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={labels.pick}
                title={labels.pick}
                onClick={pick}
              >
                <Plus aria-hidden="true" className="size-icon-sm" />
              </Button>
            </li>
          )}
        </ul>
      ) : (
        <button
          type="button"
          onClick={pick}
          className="flex w-full flex-col items-center px-space-base py-space-lg text-center outline-hidden focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-inset"
        >
          <span
            className={cn(
              'mb-space-sm grid size-icon-2xl place-items-center rounded-radius-lg',
              dragging
                ? 'bg-accent-soft text-line-focus'
                : 'bg-surface text-fg-subtle',
            )}
          >
            <Upload aria-hidden="true" className="size-icon-md" />
          </span>
          <span className="text-sm font-medium text-fg">
            {dragging ? labels.release : labels.pick}
          </span>
          <span className="mt-space-xs block text-xs text-fg-subtle">
            {labels.limits}
          </span>
        </button>
      )}
      {footer}
      <input
        ref={picker}
        type="file"
        multiple
        hidden
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const picked = Array.from(event.currentTarget.files ?? []).slice(
            0,
            room,
          )
          for (const file of picked) onUpload(file)
          // The same file can be picked again after it was removed.
          event.currentTarget.value = ''
        }}
      />
    </section>
  )
}
