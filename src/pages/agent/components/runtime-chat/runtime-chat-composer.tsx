import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Paperclip, X } from 'lucide-react'
import { ChatComposer } from '@/components/chat/chat-composer'
import { Button } from '@/components/ui/button'
import { FileIcon } from '@/components/ui/file-icon'
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
  const loading = status === AgentRuntimeStatus.RUNNING
  const sendDisabled =
    disabled || (!isTaskMode && !value.trim() && files.length === 0)

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
        <ChatComposer
          value={value}
          onChange={(content) => {
            updateDraft((current) => ({ ...current, content }))
          }}
          onSubmit={handleSend}
          state={
            loading
              ? {
                  kind: 'running',
                  stop: () => {
                    void onStop()
                  },
                }
              : { kind: 'ready' }
          }
          disabled={disabled}
          allowEmpty={isTaskMode || files.length > 0}
          placeholder={
            placeholder ||
            t(
              isTaskMode
                ? 'agent.explore.taskPlaceholder'
                : 'agent.explore.messagePlaceholder',
            )
          }
          autoSize={
            density === 'compact' ? { minRows: 1, maxRows: 4 } : undefined
          }
          labels={{
            submit: t('agent.share.send'),
            stop: t('agent.share.stop'),
          }}
          slots={{
            hint: false,
            attachments: files.length > 0 && (
              <div className="flex flex-wrap gap-space-xs">
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
            ),
            leading: (
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
                buttonClassName="text-text-tertiary hover:text-text-primary"
                disabled={disabled}
                triggerIcon={<Paperclip className="size-icon-sm" />}
              />
            ),
          }}
        />
      </div>
    </div>
  )
}
