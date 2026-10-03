import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUp, Paperclip, Square, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FileIcon } from '@/components/ui/file-icon'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { FileUploadDirectUpload } from '../../debug-content/uploader'
import {
  AgentRuntimeStatus,
  type RuntimeAttachment,
} from '../../features/runtime-workbench/types'
import type { RuntimeChatSendRequest } from './types'

interface RuntimeChatComposerProps {
  canvasId?: string
  status: AgentRuntimeStatus
  isTaskMode?: boolean
  density?: 'comfortable' | 'compact'
  placeholder?: string
  className?: string
  contentClassName?: string
  onSend: (request: RuntimeChatSendRequest) => Promise<void>
  onStop: () => Promise<void>
}

export function RuntimeChatComposer({
  canvasId,
  status,
  isTaskMode = false,
  density = 'comfortable',
  placeholder,
  className,
  contentClassName,
  onSend,
  onStop,
}: RuntimeChatComposerProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [files, setFiles] = useState<RuntimeAttachment[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const loading = status === AgentRuntimeStatus.RUNNING
  const sendDisabled = !isTaskMode && !value.trim() && files.length === 0

  useEffect(() => {
    if (!textareaRef.current) {
      return
    }

    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${Math.min(
      textareaRef.current.scrollHeight,
      density === 'compact' ? 96 : 120,
    )}px`
  }, [density, value])

  const handleSend = useCallback(async () => {
    if (loading || sendDisabled) {
      return
    }

    const requestFiles = [...files]
    await onSend({
      content: value,
      files: requestFiles,
    })
    setValue('')
    setFiles([])
  }, [files, loading, onSend, sendDisabled, value])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.nativeEvent.isComposing) {
        return
      }

      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        void handleSend()
      }
    },
    [handleSend],
  )

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index),
    )
  }, [])

  return (
    <div
      className={cn(
        'border-t border-border-default bg-components-console-surface',
        density === 'compact'
          ? 'px-space-md py-space-sm'
          : 'px-space-lg py-space-base',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto w-full',
          density === 'compact' ? 'max-w-full' : 'max-w-4xl',
          contentClassName,
        )}
      >
        <div className="rounded-radius-xl border border-components-card-border bg-components-card-bg p-space-base shadow-elevation-low">
          {files.length > 0 ? (
            <div className="mb-space-sm flex flex-wrap gap-space-xs">
              {files.map((file, index) => (
                <div
                  key={`${file.id || file.name}-${index}`}
                  className="flex max-w-full min-w-0 items-center gap-space-xs rounded-radius-md border border-border-default bg-background-subtle px-space-sm py-space-xs"
                >
                  <FileIcon
                    fileType={file.type}
                    fileName={file.name}
                    size="sm"
                  />
                  <span className="max-w-[220px] min-w-0 flex-1 truncate text-sm text-text-secondary">
                    {file.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-5 text-text-tertiary hover:text-text-primary"
                    onClick={() => handleRemoveFile(index)}
                    disabled={loading}
                    aria-label={t('agent.explore.removeAttachment', {
                      name: file.name,
                    })}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

          <Textarea
            ref={textareaRef}
            variant="chat"
            aria-label={placeholder || t('agent.explore.messagePlaceholder')}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              placeholder ||
              t(
                isTaskMode
                  ? 'agent.explore.taskPlaceholder'
                  : 'agent.explore.messagePlaceholder',
              )
            }
            className={cn(
              'w-full placeholder:text-text-tertiary',
              density === 'compact'
                ? 'min-h-[48px] text-sm'
                : 'min-h-[60px] text-base',
            )}
            rows={1}
            disabled={loading}
          />

          <div className="mt-space-sm flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <FileUploadDirectUpload
                canvasId={canvasId}
                value={files}
                onChange={(nextValue) =>
                  setFiles(nextValue as RuntimeAttachment[])
                }
                multiple
                compact
                iconOnly
                showFileList={false}
                buttonLabel={t('agent.share.uploadAttachment')}
                buttonVariant="ghost"
                buttonSize="icon"
                buttonClassName="size-10 rounded-radius-full text-text-tertiary hover:bg-components-button-ghost-bg-hover hover:text-text-primary"
                disabled={loading}
                triggerIcon={<Paperclip className="size-4" />}
              />
            </div>

            {loading ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-radius-full bg-status-error text-text-inverted hover:bg-status-error/90"
                onClick={() => {
                  void onStop()
                }}
                aria-label={t('agent.share.stop')}
              >
                <Square className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  'rounded-radius-full transition-colors disabled:opacity-100',
                  sendDisabled
                    ? 'bg-border-default text-text-tertiary'
                    : 'bg-text-primary text-text-inverted hover:bg-text-secondary',
                )}
                disabled={sendDisabled}
                onClick={() => {
                  void handleSend()
                }}
                aria-label={t('agent.share.send')}
              >
                <ArrowUp className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
