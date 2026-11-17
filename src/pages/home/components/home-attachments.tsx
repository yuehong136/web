import { useMemo } from 'react'
import type { AttachmentsProps } from '@ant-design/x'
import type { TFunction } from 'i18next'
import { Paperclip, Upload, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ControlledAttachments } from '@/components/chat/controlled-attachments'
import { FileKindTile } from '@/components/patterns/file-kind-tile'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { uploadConfig, type UploadFile } from '@/config/chat'
import { cn, formatBytes } from '@/lib/utils'
import type { HomeAttachments } from '../hooks/use-home-attachments'
import {
  COMPOSER_PILL,
  COMPOSER_PILL_IDLE,
  COMPOSER_PILL_ON,
} from './composer-pill'

type AttachmentItem = NonNullable<AttachmentsProps['items']>[number]

const statusOf = (file: UploadFile, t: TFunction) =>
  file.status === 'uploading'
    ? t('home.attachments.uploading', {
        percent: Math.round(file.percent || 0),
      })
    : file.status === 'error'
      ? t('home.attachments.failedRetry')
      : formatBytes(file.response?.size || file.size || 0)

/** Paperclip pill: opens the tray and counts the files ready to send. */
export function HomeAttachmentPill({
  attachments,
  disabled,
}: {
  attachments: HomeAttachments
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const { open, readyCount } = attachments
  return (
    <button
      type="button"
      className={cn(
        COMPOSER_PILL,
        readyCount > 0 && 'px-space-sm',
        open ? COMPOSER_PILL_ON : COMPOSER_PILL_IDLE,
      )}
      aria-pressed={open}
      disabled={disabled}
      onClick={() => attachments.setOpen(!open)}
      aria-label={t('home.input.addAttachment')}
      title={t('home.input.addAttachment')}
    >
      <Paperclip aria-hidden="true" />
      {readyCount > 0 && <span className="font-mono">{readyCount}</span>}
    </button>
  )
}

/** The tray above the draft: pick, drop or paste files; retry or remove each. */
export function HomeAttachmentTray({
  attachments,
}: {
  attachments: HomeAttachments
}) {
  const { t } = useTranslation()
  const items = useMemo<AttachmentItem[]>(
    () =>
      attachments.files.map(({ originFileObj: _file, ...file }) => ({
        ...file,
        className: file.status === 'error' ? 'cursor-pointer' : undefined,
        description: statusOf(file, t),
        icon: <FileKindTile name={file.name} size="lg" />,
        src: file.thumbUrl,
      })),
    [attachments.files, t],
  )
  if (!attachments.open) return null
  return (
    <section
      aria-label={t('home.attachments.title')}
      className="mb-space-sm rounded-radius-lg border border-border-subtle bg-background-subtle"
      data-home-attachments
    >
      <header className="flex items-center gap-space-sm border-b border-border-subtle px-space-base py-space-xs">
        <Upload aria-hidden="true" className="size-icon-sm text-text-accent" />
        <span className="flex-1 text-sm font-medium text-text-primary">
          {t('home.attachments.title')}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('home.attachments.close')}
          onClick={() => attachments.setOpen(false)}
        >
          <X aria-hidden="true" className="size-icon-sm" />
        </Button>
      </header>
      <ControlledAttachments
        items={items}
        className="px-space-base py-space-base"
        uploadLabel={t('home.attachments.add')}
        removeLabel={(name) => t('home.attachments.remove', { name })}
        retryLabel={(name) => t('home.attachments.retry', { name })}
        failureLabel={t('home.attachments.failed')}
        maxCount={uploadConfig.maxCount}
        getDropContainer={attachments.getDropContainer}
        onRemove={attachments.remove}
        onRetry={attachments.retry}
        overflow="scrollX"
        placeholder={(type) => ({
          icon: (
            <span
              className={cn(
                'mb-space-sm grid size-icon-2xl place-items-center rounded-radius-lg',
                type === 'drop'
                  ? 'bg-state-focus-10 text-state-focus'
                  : 'bg-background-surface text-text-tertiary',
              )}
            >
              <Upload aria-hidden="true" className="size-icon-md" />
            </span>
          ),
          title: (
            <span className="text-sm font-medium text-text-primary">
              {type === 'drop'
                ? t('home.attachments.release')
                : t('home.attachments.pick')}
            </span>
          ),
          description: (
            <span className="mt-space-xs block text-xs text-text-tertiary">
              {t('home.attachments.limits', {
                count: uploadConfig.maxCount,
                size: Math.round(uploadConfig.maxSize / 1024 / 1024),
              })}
            </span>
          ),
        })}
        onUpload={attachments.add}
      />
    </section>
  )
}

/** One line under the composer while files upload, fail or wait to be sent. */
export function HomeAttachmentHint({
  attachments,
}: {
  attachments: HomeAttachments
}) {
  const { t } = useTranslation()
  if (attachments.uploading)
    return (
      <span className="inline-flex items-center gap-space-xs">
        <Spinner size="sm" />
        {t('home.attachments.uploadingHint')}
      </span>
    )
  if (attachments.hasError)
    return (
      <span className="text-status-error">
        {t('home.attachments.errorHint')}
      </span>
    )
  if (attachments.readyCount > 0)
    return t('home.attachments.ready', { count: attachments.readyCount })
  return null
}
