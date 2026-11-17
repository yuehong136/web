import { Sender } from '@ant-design/x'
import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ComposerSendButton } from '@/components/chat/composer-send-button'
import { cn } from '@/lib/utils'
import { Paperclip, SlidersHorizontal, Upload } from 'lucide-react'
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
  const canSend = Boolean(value.trim() || files.length > 0)
  const isInlineLayout = layout === 'inline'

  return (
    <div
      className={cn(
        isInlineLayout
          ? undefined
          : 'shrink-0 bg-surface-primary px-space-lg py-space-base',
        className,
      )}
    >
      <div className={isInlineLayout ? 'w-full' : 'mx-auto w-full max-w-4xl'}>
        <div className="agent-share-composer overflow-hidden rounded-radius-xl border border-components-input-border bg-components-input-bg shadow-elevation-low transition-colors focus-within:border-components-input-border-focus">
          <style>{`
            .agent-share-composer .ant-sender {
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
            }
            .agent-share-composer .ant-sender:hover,
            .agent-share-composer .ant-sender:focus-within {
              border: none !important;
              box-shadow: none !important;
              outline: none !important;
            }
            .agent-share-composer .ant-sender-content {
              background: transparent !important;
              padding: 0 !important;
            }
            .agent-share-composer .ant-sender textarea,
            .agent-share-composer .ant-sender input {
              background: transparent !important;
              color: var(--color-components-input-text) !important;
              box-shadow: none !important;
              outline: none !important;
              padding: 0 !important;
            }
            .agent-share-composer .ant-sender textarea::placeholder,
            .agent-share-composer .ant-sender input::placeholder {
              color: var(--color-components-input-text-placeholder) !important;
            }
            .agent-share-composer .ant-sender-actions-list {
              display: none !important;
            }
          `}</style>

          {files.length ? (
            <div className="flex flex-wrap gap-space-xs border-b border-border-subtle px-space-base py-space-sm">
              {files.map((file) => (
                <Badge key={file.id || file.name} variant="outline">
                  {file.name || file.filename || file.id}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="px-space-base pt-space-base pb-space-xs">
            <Sender
              value={value}
              onChange={onChange}
              placeholder={t('agent.share.messagePlaceholder')}
              loading={isRunning}
              disabled={disabled || uploading}
              onSubmit={(content) => {
                if (!disabled) onSubmit(content)
              }}
              onCancel={onStop}
            />
          </div>

          <div className="flex items-center justify-between gap-space-sm px-space-base pt-space-xs pb-space-sm">
            <div className="flex items-center gap-space-xs">
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
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => attachmentInputRef.current?.click()}
                disabled={disabled || isRunning || uploading}
                title={
                  uploading
                    ? t('agent.share.uploading')
                    : t('agent.share.uploadAttachment')
                }
                aria-label={
                  uploading
                    ? t('agent.share.uploading')
                    : t('agent.share.uploadAttachment')
                }
              >
                {uploading ? <Upload /> : <Paperclip />}
              </Button>
              {hasParameters ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onOpenParameters}
                  disabled={disabled || isRunning || uploading}
                  title={t('agent.share.parameters')}
                  aria-label={t('agent.share.parameters')}
                >
                  <SlidersHorizontal />
                </Button>
              ) : null}
            </div>

            <ComposerSendButton
              size="icon-sm"
              stopVariant="destructive"
              running={Boolean(isRunning)}
              canSend={!disabled && !uploading && canSend}
              onSend={() => onSubmit(value)}
              onStop={onStop}
              sendLabel={t('agent.share.send')}
              stopLabel={t('agent.share.stop')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
