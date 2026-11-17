import { useMemo, type ReactNode } from 'react'
import type { AttachmentsProps } from '@ant-design/x'
import Sender from '@ant-design/x/es/sender'
import { Globe, Paperclip, Telescope, Upload } from 'lucide-react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { AppChatComposer } from '@/components/chat/app-chat-composer'
import { ComposerSendButton } from '@/components/chat/composer-send-button'
import { useModelIdentity } from '@/components/models/model-identity'
import { ProviderLogo } from '@/components/patterns/provider-logo'
import { ControlledAttachments } from '@/components/chat/controlled-attachments'
import { FileIcon } from '@/components/ui/file-icon'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip } from '@/components/ui/tooltip'
import { uploadConfig, type UploadFile } from '@/config/chat'
import { toast } from '@/lib/toast'
import { cn, formatBytes } from '@/lib/utils'
// Same hero composer as Home: larger radius, tide glow only while focused.
import '@/pages/home/components/tide-composer.css'
import {
  COMPOSER_PILL,
  COMPOSER_PILL_IDLE,
  COMPOSER_PILL_ON,
} from '@/pages/home/components/composer-pill'

type ExploreAttachment = NonNullable<AttachmentsProps['items']>[number]

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
      <span className="min-w-0 truncate text-text-primary">
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
    upload: (file: File) => Promise<unknown>
    remove: (uid: string) => void
    retry: (uid: string) => void
  }
  attachmentsOpen: boolean
  onAttachmentsOpenChange: (open: boolean) => void
  getDropContainer: () => HTMLElement | null
  reasoning: boolean
  onReasoningChange: (enabled: boolean) => void
  internet: boolean
  onInternetChange: (enabled: boolean) => void
  /** The app has a Tavily key; without one web search stays off. */
  internetAvailable: boolean
  /** The app's model; Explore conversations cannot switch it per turn. */
  model?: ReactNode
}

/** antd-x Sender in the board's composer: attachments, research toggles, model, send. */
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
  getDropContainer,
  reasoning,
  onReasoningChange,
  internet,
  onInternetChange,
  internetAvailable,
  model,
}: ExploreComposerProps) {
  const { t } = useTranslation()
  const items = useMemo<ExploreAttachment[]>(
    () =>
      uploads.files.map(({ originFileObj: _originFileObj, ...file }) => ({
        ...file,
        className: file.status === 'error' ? 'cursor-pointer' : undefined,
        description: getAttachmentStatusLabel(file, t),
        icon: file.response ? (
          <FileIcon fileName={file.response.name} size="sm" />
        ) : undefined,
        src: file.thumbUrl,
      })),
    [t, uploads.files],
  )
  const upload = (file: File) => {
    if (file.size > uploadConfig.maxSize) {
      toast.error(t('explore.toast.fileTooLarge', { name: file.name }))
      return
    }
    void uploads.upload(file)
  }
  const submit = () => {
    if (!canSubmit) return
    onSubmit(value)
    onAttachmentsOpenChange(false)
  }
  return (
    <div className="tide-composer">
      <AppChatComposer
        value={value}
        onChange={onChange}
        placeholder={t('explore.sender.placeholder')}
        loading={isStreaming}
        disabled={disabled}
        header={
          <Sender.Header
            title={
              <span className="flex items-center gap-space-sm text-sm font-medium text-text-primary">
                <Upload aria-hidden="true" className="size-icon-sm" />
                {t('explore.sender.uploadFile')}
              </span>
            }
            open={attachmentsOpen}
            onOpenChange={onAttachmentsOpenChange}
            classNames={{
              header: 'border-b border-border-subtle px-space-md py-space-base',
              content: 'p-0',
            }}
          >
            <ControlledAttachments
              items={items}
              className="px-space-md py-space-base"
              uploadLabel={t('explore.sender.uploadFile')}
              removeLabel={(name) =>
                t('explore.attachmentStatus.remove', { name })
              }
              failureLabel={t('explore.attachmentStatus.failed')}
              retryLabel={(name) =>
                t('explore.attachmentStatus.retry', { name })
              }
              maxCount={uploadConfig.maxCount}
              getDropContainer={getDropContainer}
              onRemove={uploads.remove}
              onRetry={uploads.retry}
              overflow="scrollX"
              placeholder={(type) => ({
                icon: (
                  <span
                    className={cn(
                      'mb-space-base grid size-icon-2xl place-items-center rounded-radius-lg',
                      type === 'drop'
                        ? 'bg-state-focus-10 text-state-focus'
                        : 'bg-background-subtle text-text-tertiary',
                    )}
                  >
                    <Upload aria-hidden="true" className="size-icon-md" />
                  </span>
                ),
                title: (
                  <span className="text-sm font-medium text-text-primary">
                    {type === 'drop'
                      ? t('explore.dragUpload.titleShort')
                      : t('explore.dragUpload.action')}
                  </span>
                ),
                description: (
                  <span className="mt-space-xs block text-xs text-text-tertiary">
                    {t('explore.dragUpload.limits', {
                      count: uploadConfig.maxCount,
                      size: Math.round(uploadConfig.maxSize / 1024 / 1024),
                    })}
                  </span>
                ),
              })}
              onUpload={async (file) => {
                const result = await uploads.upload(file)
                if (result)
                  toast.success(
                    t('explore.toast.uploadSuccess', { name: file.name }),
                  )
              }}
            />
          </Sender.Header>
        }
        suffix={false}
        onSubmit={submit}
        onCancel={onStop}
        onPasteFile={(files) => {
          if (files.length > 0) onAttachmentsOpenChange(true)
          for (let i = 0; i < files.length; i++) upload(files[i])
        }}
        footer={
          <div className="flex min-w-0 items-center gap-space-xs px-space-sm pt-space-xs pb-space-sm">
            <button
              type="button"
              className={cn(
                COMPOSER_PILL,
                uploads.readyCount > 0 && 'px-space-sm',
                attachmentsOpen ? COMPOSER_PILL_ON : COMPOSER_PILL_IDLE,
              )}
              aria-pressed={attachmentsOpen}
              onClick={() => onAttachmentsOpenChange(!attachmentsOpen)}
              aria-label={t('explore.sender.uploadFile')}
              title={t('explore.sender.uploadFile')}
            >
              <Paperclip aria-hidden="true" />
              {uploads.readyCount > 0 && (
                <span className="font-mono">{uploads.readyCount}</span>
              )}
            </button>
            <button
              type="button"
              className={cn(
                COMPOSER_PILL,
                'px-space-base',
                reasoning ? COMPOSER_PILL_ON : COMPOSER_PILL_IDLE,
              )}
              aria-pressed={reasoning}
              onClick={() => onReasoningChange(!reasoning)}
            >
              <Telescope aria-hidden="true" />
              {t('explore.sender.thinking')}
            </button>
            <Tooltip
              content={t('explore.sender.onlineSearchUnavailable')}
              disabled={internetAvailable}
            >
              <button
                type="button"
                className={cn(
                  COMPOSER_PILL,
                  'px-space-base',
                  internet && internetAvailable
                    ? COMPOSER_PILL_ON
                    : COMPOSER_PILL_IDLE,
                )}
                aria-pressed={internet && internetAvailable}
                disabled={!internetAvailable}
                onClick={() => onInternetChange(!internet)}
              >
                <Globe aria-hidden="true" />
                {t('explore.sender.onlineSearch')}
              </button>
            </Tooltip>
            <span
              className="ms-auto flex min-w-0 items-center gap-space-sm text-xs text-text-tertiary"
              aria-live="polite"
            >
              {uploads.uploading ? (
                <span className="flex items-center gap-space-xs">
                  <Spinner size="sm" />
                  {t('explore.sender.uploading')}
                </span>
              ) : uploads.hasError ? (
                <span className="text-status-error">
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
            <ComposerSendButton
              running={isStreaming}
              canSend={canSubmit}
              onSend={submit}
              onStop={onStop}
              sendLabel={t('studio.editor.send')}
              stopLabel={t('explore.sender.stop')}
              className="rounded-radius-full"
            />
          </div>
        }
      />
    </div>
  )
}
