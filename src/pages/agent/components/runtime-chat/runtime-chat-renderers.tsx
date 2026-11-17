import { useTranslation } from 'react-i18next'
import { Bot, Download, User } from 'lucide-react'
import { FileKindTile } from '@/components/patterns/file-kind-tile'
import { formatBytes } from '@/lib/utils'
import {
  markdownConfig,
  type MarkdownComponents,
  useMarkdownComponents,
} from '@/components/chat/MarkdownCodeBlock'
import { StreamingXMarkdown } from '@/components/chat/streaming-x-markdown'
import {
  extractReferencesFromSSEData,
  type ReferenceChunk,
} from '@/utils/reference-replacer'
import type {
  RuntimeAttachment,
  RuntimeMessage,
} from '../../features/runtime-workbench/types'
import { EntityAvatar } from '@/components/patterns/entity-avatar'

interface RuntimeChatMarkdownProps {
  content: string
  streaming?: boolean
  components?: Partial<MarkdownComponents>
}

export function getReferenceChunks(reference: unknown): ReferenceChunk[] {
  if (Array.isArray(reference)) {
    return extractReferencesFromSSEData({ chunks: reference })
  }

  return extractReferencesFromSSEData({ reference })
}

// Share and widget visitors are anonymous, so both roles use neutral icons.
export function AssistantAvatar() {
  return <EntityAvatar shape="circle" tone="neutral" icon={<Bot />} />
}

export function UserAvatar() {
  return <EntityAvatar shape="circle" tone="neutral" icon={<User />} />
}

export function RuntimeChatMarkdown({
  content,
  streaming = false,
  components,
}: RuntimeChatMarkdownProps) {
  const markdownComponents = useMarkdownComponents(components)

  if (!content.trim()) {
    return null
  }

  return (
    <div className="bubble-copy-text markdown-content prose prose-sm max-w-none dark:prose-invert">
      <StreamingXMarkdown
        paragraphTag="div"
        config={markdownConfig}
        components={markdownComponents}
        content={content}
        isStreaming={streaming}
      />
    </div>
  )
}

const getAttachmentExtension = (file: RuntimeAttachment) => {
  const explicitType = typeof file.type === 'string' ? file.type : undefined
  const explicitFormat =
    typeof file.format === 'string' ? file.format : undefined
  const extensionFromName = file.name.includes('.')
    ? file.name.split('.').pop()
    : undefined

  return (explicitType || explicitFormat || extensionFromName || '')
    .toLowerCase()
    .replace(/^\./, '')
}

export function RuntimeAttachmentList({
  message,
  onDownloadAttachment,
}: {
  message: RuntimeMessage
  onDownloadAttachment?: (file: RuntimeAttachment) => void | Promise<void>
}) {
  const { t } = useTranslation()
  if (!message.files?.length) {
    return null
  }

  return (
    <ul className="mt-space-sm flex flex-wrap gap-space-sm">
      {message.files.map((file, index) => {
        const extension = getAttachmentExtension(file)
        // The tile reads the kind from an extension; the type may say more.
        const kindName = extension ? `file.${extension}` : file.name
        const details = (
          <>
            <FileKindTile name={kindName} size="lg" />
            <span className="min-w-0 flex-1 text-start">
              <span className="block truncate text-sm text-text-primary">
                {file.name}
              </span>
              <span className="block truncate text-xs text-text-tertiary">
                {onDownloadAttachment
                  ? t('agent.explore.downloadAttachment')
                  : file.size
                    ? formatBytes(file.size)
                    : extension.toUpperCase()}
              </span>
            </span>
          </>
        )
        const chip =
          'flex w-60 max-w-full items-center gap-space-sm rounded-radius-md border border-border-subtle bg-components-input-bg p-space-sm'
        return (
          <li key={`${file.id || file.name}-${index}`} className="max-w-full">
            {onDownloadAttachment ? (
              <button
                type="button"
                className={`${chip} outline-hidden transition-colors hover:bg-state-hover focus-visible:ring-2 focus-visible:ring-state-focus motion-reduce:transition-none`}
                onClick={() => {
                  void onDownloadAttachment(file)
                }}
              >
                {details}
                <Download
                  aria-hidden="true"
                  className="size-icon-sm shrink-0 text-text-tertiary"
                />
              </button>
            ) : (
              <div className={chip}>{details}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
