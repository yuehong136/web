import { FileIcon } from '@/components/ui/file-icon'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import type { RuntimeAttachment } from '../features/runtime-workbench/types'

export interface RuntimeMessageBubbleData {
  role?: string
  content?: string
  thinking?: string
  tips?: string
  files?: RuntimeAttachment[]
  error?: string
}

interface RuntimeMessageBubbleProps {
  message: RuntimeMessageBubbleData
  children?: ReactNode
}

function RuntimeAttachmentList({
  files = [],
}: {
  files?: RuntimeAttachment[]
}) {
  if (!files.length) {
    return null
  }

  return (
    <div className="mt-space-sm flex flex-wrap gap-space-sm">
      {files.map((file, index) => (
        <div
          key={`${file.id || file.name}-${index}`}
          className="flex items-center gap-space-sm rounded-radius-md border border-border-default bg-surface-secondary px-space-sm py-space-xs"
        >
          <FileIcon fileType={file.type} fileName={file.name} size="sm" />
          <span className="max-w-[220px] truncate text-sm text-text-primary">
            {file.name}
          </span>
        </div>
      ))}
    </div>
  )
}

export function RuntimeMessageBubble({
  message,
  children,
}: RuntimeMessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[88%] rounded-radius-lg px-space-base py-space-sm',
          isUser
            ? 'bg-surface-accent text-text-on-accent'
            : 'bg-surface-secondary text-text-primary',
        )}
      >
        {message.thinking ? (
          <div className="mb-space-sm rounded-radius-md border border-border-primary bg-surface-primary p-space-sm text-xs text-text-secondary">
            <p className="mb-space-xs font-medium text-text-primary">
              Thinking
            </p>
            <p className="whitespace-pre-wrap">{message.thinking}</p>
          </div>
        ) : null}

        <p className="whitespace-pre-wrap text-sm">{message.content || '...'}</p>

        {message.tips ? (
          <div className="mt-space-sm rounded-radius-md border border-border-primary bg-surface-primary p-space-sm text-sm text-text-secondary">
            {message.tips}
          </div>
        ) : null}

        <RuntimeAttachmentList files={message.files} />
        {children}

        {message.error ? (
          <p className="mt-space-sm text-xs text-status-error">
            {message.error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
