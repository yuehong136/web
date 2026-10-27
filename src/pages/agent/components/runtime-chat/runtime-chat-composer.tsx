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
import {
  EMPTY_RUNTIME_CHAT_DRAFT,
  type RuntimeChatDraft,
  type RuntimeChatSendResult,
} from './types'

type DraftUpdate = (draft: RuntimeChatDraft) => RuntimeChatDraft

interface RuntimeChatComposerProps {
  canvasId?: string
  status: AgentRuntimeStatus
  disabled?: boolean
  isTaskMode?: boolean
  density?: 'comfortable' | 'compact'
  placeholder?: string
  className?: string
  contentClassName?: string
  /**
   * Controlled draft. Its owner keeps it per conversation and clears the
   * submitted draft once the send is accepted. Without it the composer keeps
   * its own draft and clears it when `onSend` does not return `false`.
   */
  draft?: RuntimeChatDraft
  onDraftChange?: (update: DraftUpdate) => void
  /** Receives the draft itself; returns `false` when the send was not accepted. */
  onSend: (draft: RuntimeChatDraft) => RuntimeChatSendResult
  onStop: () => Promise<void>
}

export function RuntimeChatComposer({
  canvasId,
  status,
  isTaskMode = false,
  disabled = false,
  density = 'comfortable',
  placeholder,
  className,
  contentClassName,
  draft: controlledDraft,
  onDraftChange,
  onSend,
  onStop,
}: RuntimeChatComposerProps) {
  const { t } = useTranslation()
  const [localDraft, setLocalDraft] = useState(EMPTY_RUNTIME_CHAT_DRAFT)
  const controlled = controlledDraft !== undefined
  const draft = controlledDraft ?? localDraft
  const { content: value, files } = draft
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const loading = status === AgentRuntimeStatus.RUNNING
  const sendDisabled =
    disabled || (!isTaskMode && !value.trim() && files.length === 0)

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

  // 附件在上传完成后才回写，必须基于当时的草稿更新，不能覆盖上传期间输入的文字
  const updateDraft = useCallback(
    (update: DraftUpdate) => {
      if (controlled) onDraftChange?.(update)
      else setLocalDraft(update)
    },
    [controlled, onDraftChange],
  )

  // 运行中可以照常写下一条，但只在空闲时发送；被拒绝时草稿原样保留，
  // 被接纳时只清掉提交的那一份
  const handleSend = useCallback(() => {
    if (loading || sendDisabled) {
      return
    }

    const submitted = draft
    if (onSend(submitted) === false || controlled) {
      return
    }
    setLocalDraft((current) =>
      current === submitted ? EMPTY_RUNTIME_CHAT_DRAFT : current,
    )
  }, [controlled, draft, loading, onSend, sendDisabled])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      // 输入法组字时的 Enter 只确认组字；浏览器上报方式不一，三种都拦住
      if (
        event.nativeEvent.isComposing ||
        event.keyCode === 229 ||
        event.key === 'Process'
      ) {
        return
      }

      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleRemoveFile = useCallback(
    (index: number) => {
      updateDraft((current) => ({
        ...current,
        files: current.files.filter((_, itemIndex) => itemIndex !== index),
      }))
    },
    [updateDraft],
  )

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
                    disabled={disabled}
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

          {/* 生成中也可编写下一条草稿；等待补填输入时由 disabled 锁定 */}
          <Textarea
            ref={textareaRef}
            variant="chat"
            aria-label={placeholder || t('agent.explore.messagePlaceholder')}
            value={value}
            onChange={(event) => {
              const content = event.target.value
              updateDraft((current) => ({ ...current, content }))
            }}
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
            disabled={disabled}
          />

          <div className="mt-space-sm flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <FileUploadDirectUpload
                canvasId={canvasId}
                value={files}
                onChange={(nextValue) => {
                  const nextFiles = nextValue as RuntimeAttachment[]
                  updateDraft((current) => ({ ...current, files: nextFiles }))
                }}
                multiple
                compact
                iconOnly
                showFileList={false}
                buttonLabel={t('agent.share.uploadAttachment')}
                buttonVariant="ghost"
                buttonSize="icon"
                buttonClassName="size-10 rounded-radius-full text-text-tertiary hover:bg-components-button-ghost-bg-hover hover:text-text-primary"
                disabled={disabled}
                triggerIcon={<Paperclip className="size-4" />}
              />
            </div>

            {loading ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-radius-full bg-status-error-solid text-status-error-on-solid hover:bg-status-error-solid-hover"
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
                onClick={handleSend}
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
