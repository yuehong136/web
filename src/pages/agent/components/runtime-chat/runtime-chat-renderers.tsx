import { FileCard } from '@ant-design/x'
import XMarkdown from '@ant-design/x-markdown'
import type { ComponentProps } from 'react'
import { Bot, User } from 'lucide-react'
import {
  getMarkdownStreamingOptions,
  markdownConfig,
  type MarkdownComponents,
  useMarkdownComponents,
} from '@/components/chat/MarkdownCodeBlock'
import {
  extractReferencesFromSSEData,
  type ReferenceChunk,
} from '@/utils/reference-replacer'
import type {
  RuntimeAttachment,
  RuntimeMessage,
} from '../../features/runtime-workbench/types'

interface RuntimeChatMarkdownProps {
  content: string
  streaming?: boolean
  components?: Partial<MarkdownComponents>
}

export function getReferenceChunks(reference: unknown): ReferenceChunk[] {
  if (Array.isArray(reference)) {
    return reference as ReferenceChunk[]
  }

  return extractReferencesFromSSEData({ reference })
}

export function AssistantAvatar() {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-radius-full bg-chat-bubble-assistant-avatar-bg text-chat-bubble-assistant-avatar-text">
      <Bot className="size-4" />
    </div>
  )
}

export function UserAvatar() {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-radius-full bg-chat-bubble-user-avatar-bg text-chat-bubble-user-avatar-text">
      <User className="size-4" />
    </div>
  )
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
    <div className="prose prose-sm max-w-none dark:prose-invert bubble-copy-text markdown-content">
      <XMarkdown
        paragraphTag="div"
        config={markdownConfig}
        components={markdownComponents}
        streaming={getMarkdownStreamingOptions(streaming)}
      >
        {content}
      </XMarkdown>
    </div>
  )
}

const fileCardIconMap: Record<string, ComponentProps<typeof FileCard>['icon']> = {
  csv: 'excel',
  doc: 'word',
  docx: 'word',
  html: 'default',
  jpeg: 'image',
  jpg: 'image',
  js: 'javascript',
  markdown: 'markdown',
  md: 'markdown',
  mdx: 'markdown',
  mp3: 'audio',
  mp4: 'video',
  pdf: 'pdf',
  png: 'image',
  ppt: 'ppt',
  pptx: 'ppt',
  py: 'python',
  txt: 'default',
  wav: 'audio',
  xls: 'excel',
  xlsx: 'excel',
  zip: 'zip',
}

const getAttachmentExtension = (file: RuntimeAttachment) => {
  const explicitType =
    typeof file.type === 'string' ? file.type : undefined
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
  if (!message.files?.length) {
    return null
  }

  return (
    <div className="mt-space-sm flex flex-wrap gap-space-sm">
      {message.files.map((file, index) => (
        <FileCard
          key={`${file.id || file.name}-${index}`}
          name={file.name}
          byte={file.size}
          size="small"
          type="file"
          icon={fileCardIconMap[getAttachmentExtension(file)] || 'default'}
          description={onDownloadAttachment ? '点击下载' : undefined}
          className={onDownloadAttachment ? 'cursor-pointer' : undefined}
          onClick={
            onDownloadAttachment
              ? () => {
                  void onDownloadAttachment(file)
                }
              : undefined
          }
        />
      ))}
    </div>
  )
}
