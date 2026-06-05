import { Sender } from '@ant-design/x'
import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ArrowUp,
  Paperclip,
  SlidersHorizontal,
  Square,
  Upload,
} from 'lucide-react'
import type { AgentCanvasUploadResult } from '@/types/agent'

interface ShareComposerProps {
  value: string
  files: AgentCanvasUploadResult[]
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
          : 'bg-surface-primary px-space-lg py-space-base shrink-0',
        className,
      )}
    >
      <div className={isInlineLayout ? 'w-full' : 'mx-auto w-full max-w-4xl'}>
        <div className="agent-share-composer rounded-radius-xl shadow-elevation-low overflow-hidden border border-components-input-border bg-components-input-bg transition-colors focus-within:border-components-input-border-focus">
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
            <div className="gap-space-xs px-space-base py-space-sm flex flex-wrap border-b border-border-subtle">
              {files.map((file) => (
                <Badge key={file.id || file.name} variant="outline">
                  {file.name || file.filename || file.id}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="px-space-base pb-space-xs pt-space-base">
            <Sender
              value={value}
              onChange={onChange}
              placeholder={t(
                'agent.share.messagePlaceholder',
                '输入消息，按 Enter 发送',
              )}
              loading={isRunning}
              disabled={uploading}
              onSubmit={onSubmit}
              onCancel={onStop}
            />
          </div>

          <div className="gap-space-sm px-space-base pb-space-sm pt-space-xs flex items-center justify-between">
            <div className="gap-space-xs flex items-center">
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
                disabled={isRunning || uploading}
                title={
                  uploading
                    ? t('agent.share.uploading', '上传中')
                    : t('agent.share.uploadAttachment', '上传附件')
                }
                aria-label={
                  uploading
                    ? t('agent.share.uploading', '上传中')
                    : t('agent.share.uploadAttachment', '上传附件')
                }
              >
                {uploading ? <Upload /> : <Paperclip />}
              </Button>
              {hasParameters ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onOpenParameters}
                  disabled={isRunning || uploading}
                  title={t('agent.share.parameters', '运行参数')}
                  aria-label={t('agent.share.parameters', '运行参数')}
                >
                  <SlidersHorizontal />
                </Button>
              ) : null}
            </div>

            {isRunning ? (
              <Button
                variant="destructive"
                size="icon-sm"
                onClick={onStop}
                title={t('agent.share.stop', '停止输出')}
                aria-label={t('agent.share.stop', '停止输出')}
              >
                <Square />
              </Button>
            ) : (
              <Button
                size="icon-sm"
                onClick={() => onSubmit(value)}
                disabled={uploading || !canSend}
                title={t('agent.share.send', '发送')}
                aria-label={t('agent.share.send', '发送')}
              >
                <ArrowUp />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
