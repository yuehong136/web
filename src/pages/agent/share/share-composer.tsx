import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Paperclip, SlidersHorizontal, Upload } from 'lucide-react'
import { ChatComposer } from '@/components/chat/chat-composer'
import { PromptInputButton } from '@/components/patterns/chat/prompt-input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AgentCanvasUploadResult } from '@/types/agent'

interface ShareComposerProps {
  value: string
  files: AgentCanvasUploadResult[]
  disabled?: boolean
  isRunning?: boolean
  uploading?: boolean
  hasParameters?: boolean
  className?: string
  layout?: 'default' | 'inline'
  attachmentInputRef: RefObject<HTMLInputElement | null>
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  onStop: () => void
  onOpenParameters: () => void
  onUploadFiles: (files: FileList) => void
}

/** The shared agent page's composer: attachments, run parameters, send/stop. */
export function ShareComposer({
  value,
  files,
  isRunning,
  disabled,
  uploading,
  hasParameters,
  className,
  layout = 'default',
  attachmentInputRef,
  onChange,
  onSubmit,
  onStop,
  onOpenParameters,
  onUploadFiles,
}: ShareComposerProps) {
  const { t } = useTranslation()
  const isInlineLayout = layout === 'inline'
  const toolsDisabled = disabled || isRunning || uploading
  const uploadLabel = uploading
    ? t('agent.share.uploading')
    : t('agent.share.uploadAttachment')

  return (
    <div
      className={cn(
        isInlineLayout
          ? undefined
          : 'shrink-0 bg-surface px-space-lg py-space-base',
        className,
      )}
    >
      <div className={isInlineLayout ? 'w-full' : 'mx-auto w-full max-w-4xl'}>
        {/* eslint-disable-next-line no-restricted-syntax -- Native file picker is hidden; the shared Input wrapper renders visible chrome here. */}
        <input
          ref={attachmentInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) {
              onUploadFiles(event.target.files)
            }
            event.target.value = ''
          }}
        />
        <ChatComposer
          value={value}
          onChange={onChange}
          onSubmit={(content) => onSubmit(content)}
          placeholder={t('agent.share.messagePlaceholder')}
          disabled={disabled || uploading}
          allowEmpty={files.length > 0}
          state={
            isRunning ? { kind: 'running', stop: onStop } : { kind: 'ready' }
          }
          onPasteFile={toolsDisabled ? undefined : onUploadFiles}
          labels={{
            submit: t('agent.share.send'),
            stop: t('agent.share.stop'),
          }}
          autoSize={{ minRows: 1, maxRows: 6 }}
          slots={{
            hint: false,
            attachments: files.length ? (
              <div className="flex flex-wrap gap-space-xs">
                {files.map((file) => (
                  <Badge key={file.id || file.name} variant="outline">
                    {file.name || file.filename || file.id}
                  </Badge>
                ))}
              </div>
            ) : undefined,
            leading: (
              <>
                <PromptInputButton
                  iconOnly
                  onClick={() => attachmentInputRef.current?.click()}
                  disabled={toolsDisabled}
                  title={uploadLabel}
                  aria-label={uploadLabel}
                >
                  {uploading ? (
                    <Upload aria-hidden="true" />
                  ) : (
                    <Paperclip aria-hidden="true" />
                  )}
                </PromptInputButton>
                {hasParameters ? (
                  <PromptInputButton
                    iconOnly
                    onClick={onOpenParameters}
                    disabled={toolsDisabled}
                    title={t('agent.share.parameters')}
                    aria-label={t('agent.share.parameters')}
                  >
                    <SlidersHorizontal aria-hidden="true" />
                  </PromptInputButton>
                ) : null}
              </>
            ),
          }}
        />
      </div>
    </div>
  )
}
