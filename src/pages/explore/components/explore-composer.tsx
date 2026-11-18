import type { ReactNode } from 'react'
import { Globe, Paperclip, Telescope } from 'lucide-react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { ChatComposer } from '@/components/chat/chat-composer'
import { useModelIdentity } from '@/components/models/model-identity'
import { ProviderLogo } from '@/components/patterns/provider-logo'
import { PromptInputButton } from '@/components/patterns/chat/prompt-input'
import { PromptInputAttachments } from '@/components/patterns/chat/prompt-input-attachments'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip } from '@/components/ui/tooltip'
import { uploadConfig, type UploadFile } from '@/config/chat'
import { formatBytes } from '@/lib/utils'
// Same hero composer as Home: larger radius, tide glow only while focused.
import '@/components/patterns/chat/tide-composer.css'

const getAttachmentStatusLabel = (file: UploadFile, t: TFunction) => {
  if (file.status === 'uploading')
    return t('explore.attachmentStatus.uploading', {
      percent: Math.round(file.percent || 0),
    })
  if (file.status === 'error') return t('explore.attachmentStatus.error')
  if (file.response)
    return t('explore.attachmentStatus.ready', {
      type: file.response.extension?.toUpperCase() || 'FILE',
      size: formatBytes(file.response.size || file.size || 0),
    })
  return formatBytes(file.size || 0)
}

/** The app's own model as a pill caption: provider logo, name, "app default". */
export function ExploreAppModel({ reference }: { reference: string }) {
  const { t } = useTranslation()
  const identity = useModelIdentity({ reference })
  return (
    <span
      data-model-identity
      className="inline-flex min-w-0 items-center gap-space-xs"
    >
      {identity.provider ? (
        <ProviderLogo provider={identity.provider} size="sm" />
      ) : null}
      <span className="min-w-0 truncate text-fg">
        {identity.label ?? t('common.modelPicker.savedModel')}
      </span>
      <span className="shrink-0">· {t('explore.sender.appModel')}</span>
    </span>
  )
}

export interface ExploreComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (message: string) => void
  onStop: () => void
  isStreaming: boolean
  disabled: boolean
  canSubmit: boolean
  uploads: {
    files: UploadFile[]
    uploading: boolean
    readyCount: number
    hasError: boolean
    /** Checks the size, uploads and reports the result. */
    add: (file: File) => void
    remove: (uid: string) => void
    retry: (uid: string) => void
  }
  attachmentsOpen: boolean
  onAttachmentsOpenChange: (open: boolean) => void
  /** Files are being dragged over the page. */
  dragging: boolean
  reasoning: boolean
  onReasoningChange: (enabled: boolean) => void
  internet: boolean
  onInternetChange: (enabled: boolean) => void
  /** The app has a Tavily key; without one web search stays off. */
  internetAvailable: boolean
  /** The app's model; Explore conversations cannot switch it per turn. */
  model?: ReactNode
}

/** The shared composer with attachments, research toggles, the app model and send. */
export function ExploreComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
  disabled,
  canSubmit,
  uploads,
  attachmentsOpen,
  onAttachmentsOpenChange,
  dragging,
  reasoning,
  onReasoningChange,
  internet,
  onInternetChange,
  internetAvailable,
  model,
}: ExploreComposerProps) {
  const { t } = useTranslation()
  return (
    <ChatComposer
      className="tide-composer"
      value={value}
      onChange={onChange}
      placeholder={t('explore.sender.placeholder')}
      disabled={disabled}
      // The page decides when a turn can go: text, or attachments alone.
      allowEmpty={canSubmit}
      state={
        isStreaming
          ? { kind: 'running', stop: onStop }
          : canSubmit
            ? { kind: 'ready' }
            : { kind: 'blocked' }
      }
      onSubmit={(message) => {
        onSubmit(message)
        onAttachmentsOpenChange(false)
      }}
      onPasteFile={(files) => {
        onAttachmentsOpenChange(true)
        for (const file of Array.from(files)) uploads.add(file)
      }}
      autoSize={{ minRows: 2, maxRows: 8 }}
      labels={{
        submit: t('studio.editor.send'),
        stop: t('explore.sender.stop'),
      }}
      slots={{
        hint: false,
        attachments: attachmentsOpen ? (
          <PromptInputAttachments
            files={uploads.files}
            describe={(file) => getAttachmentStatusLabel(file, t)}
            labels={{
              title: t('explore.sender.uploadFile'),
              close: t('common.close'),
              pick: t('explore.dragUpload.action'),
              release: t('explore.dragUpload.titleShort'),
              limits: t('explore.dragUpload.limits', {
                count: uploadConfig.maxCount,
                size: Math.round(uploadConfig.maxSize / 1024 / 1024),
              }),
              remove: (name) => t('explore.attachmentStatus.remove', { name }),
              retry: (name) => t('explore.attachmentStatus.retry', { name }),
            }}
            maxCount={uploadConfig.maxCount}
            dragging={dragging}
            onUpload={uploads.add}
            onRemove={uploads.remove}
            onRetry={uploads.retry}
            onClose={() => onAttachmentsOpenChange(false)}
          />
        ) : undefined,
        leading: (
          <>
            <PromptInputButton
              iconOnly
              className={uploads.readyCount > 0 ? 'px-space-sm' : undefined}
              pressed={attachmentsOpen}
              onClick={() => onAttachmentsOpenChange(!attachmentsOpen)}
              aria-label={t('explore.sender.uploadFile')}
              title={t('explore.sender.uploadFile')}
            >
              <Paperclip aria-hidden="true" />
              {uploads.readyCount > 0 && (
                <span className="font-mono">{uploads.readyCount}</span>
              )}
            </PromptInputButton>
            <PromptInputButton
              pressed={reasoning}
              onClick={() => onReasoningChange(!reasoning)}
            >
              <Telescope aria-hidden="true" />
              {t('explore.sender.thinking')}
            </PromptInputButton>
            <Tooltip
              content={t('explore.sender.onlineSearchUnavailable')}
              disabled={internetAvailable}
            >
              <PromptInputButton
                pressed={internet && internetAvailable}
                disabled={!internetAvailable}
                onClick={() => onInternetChange(!internet)}
              >
                <Globe aria-hidden="true" />
                {t('explore.sender.onlineSearch')}
              </PromptInputButton>
            </Tooltip>
          </>
        ),
        configuration: (
          <span
            className="flex min-w-0 items-center gap-space-sm text-xs text-fg-subtle"
            aria-live="polite"
          >
            {uploads.uploading ? (
              <span className="flex items-center gap-space-xs">
                <Spinner size="sm" />
                {t('explore.sender.uploading')}
              </span>
            ) : uploads.hasError ? (
              <span className="text-danger-fg">
                {t('explore.sender.uploadErrorHint')}
              </span>
            ) : uploads.readyCount > 0 ? (
              <span className="truncate">
                {t('explore.sender.attachmentsReady', {
                  count: uploads.readyCount,
                })}
                {!value.trim() && ` · ${t('explore.sender.canSendDirectly')}`}
              </span>
            ) : null}
            {model && (
              <span className="hidden min-w-0 items-center gap-space-xs truncate sm:inline-flex">
                {model}
              </span>
            )}
          </span>
        ),
      }}
    />
  )
}
