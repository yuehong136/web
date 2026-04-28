import { Sender } from '@ant-design/x'
import type { RefObject } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUp, Paperclip, SlidersHorizontal, Square, Upload } from 'lucide-react'
import type { AgentCanvasUploadResult } from '@/types/agent'

interface ShareComposerProps {
  value: string
  files: AgentCanvasUploadResult[]
  isRunning?: boolean
  uploading?: boolean
  hasParameters?: boolean
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
  attachmentInputRef,
  onChange,
  onSubmit,
  onStop,
  onOpenParameters,
  onUploadFiles,
}: ShareComposerProps) {
  const canSend = Boolean(value.trim() || files.length > 0)

  return (
    <div className="shrink-0 bg-surface-primary px-space-lg py-space-base">
      <div className="mx-auto w-full max-w-4xl">
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
            .agent-share-composer .ant-sender-actions {
              align-self: flex-start !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .agent-share-composer .ant-sender-actions-btn {
              background: var(--color-components-button-primary-bg) !important;
              color: var(--color-components-button-primary-text) !important;
              border: none !important;
            }
            .agent-share-composer .ant-sender-actions-btn:hover {
              background: var(--color-components-button-primary-bg-hover) !important;
            }
            .agent-share-composer .ant-sender-actions-btn:disabled {
              background: var(--color-components-button-primary-bg-disabled) !important;
              color: var(--color-components-button-primary-text-disabled) !important;
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

          <div className="px-space-base pb-space-xs pt-space-base">
            <Sender
              value={value}
              onChange={onChange}
              placeholder="输入消息，按 Enter 发送"
              loading={isRunning}
              disabled={uploading}
              onSubmit={onSubmit}
              onCancel={onStop}
              suffix={() => null}
            />
          </div>

          <div className="flex items-center justify-between gap-space-sm px-space-base pb-space-sm pt-space-xs">
            <div className="flex items-center gap-space-xs">
              {/* Hidden file input is required because the shared Input wrapper renders visible layout chrome. */}
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
                title={uploading ? '上传中' : '上传附件'}
                aria-label={uploading ? '上传中' : '上传附件'}
              >
                {uploading ? (
                  <Upload className="h-4 w-4" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
              </Button>
              {hasParameters ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onOpenParameters}
                  disabled={isRunning || uploading}
                  title="运行参数"
                  aria-label="运行参数"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              ) : null}
            </div>

            {isRunning ? (
              <Button
                variant="destructive"
                size="icon-sm"
                onClick={onStop}
                title="停止输出"
                aria-label="停止输出"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="icon-sm"
                onClick={() => onSubmit(value)}
                disabled={uploading || !canSend}
                title="发送"
                aria-label="发送"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
