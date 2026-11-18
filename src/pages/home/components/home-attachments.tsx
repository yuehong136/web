import type { TFunction } from 'i18next'
import { Paperclip } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PromptInputAttachments } from '@/components/patterns/chat/prompt-input-attachments'
import { Spinner } from '@/components/ui/spinner'
import { uploadConfig, type UploadFile } from '@/config/chat'
import { cn, formatBytes } from '@/lib/utils'
import type { HomeAttachments } from '../hooks/use-home-attachments'
import {
  COMPOSER_PILL,
  COMPOSER_PILL_IDLE,
  COMPOSER_PILL_ON,
} from '@/components/patterns/chat/composer-pill'

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
  if (!attachments.open) return null
  return (
    <PromptInputAttachments
      className="mb-space-sm"
      files={attachments.files}
      describe={(file) => statusOf(file, t)}
      labels={{
        title: t('home.attachments.title'),
        close: t('home.attachments.close'),
        pick: t('home.attachments.pick'),
        release: t('home.attachments.release'),
        limits: t('home.attachments.limits', {
          count: uploadConfig.maxCount,
          size: Math.round(uploadConfig.maxSize / 1024 / 1024),
        }),
        remove: (name) => t('home.attachments.remove', { name }),
        retry: (name) => t('home.attachments.retry', { name }),
      }}
      maxCount={uploadConfig.maxCount}
      dragging={attachments.dragging}
      onUpload={(file) => void attachments.add(file)}
      onRemove={attachments.remove}
      onRetry={attachments.retry}
      onClose={() => attachments.setOpen(false)}
    />
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
      <span className="text-danger-fg">{t('home.attachments.errorHint')}</span>
    )
  if (attachments.readyCount > 0)
    return t('home.attachments.ready', { count: attachments.readyCount })
  return null
}
