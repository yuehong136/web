import React from 'react'
import { Bot, User } from 'lucide-react'
import XMarkdown from '@ant-design/x-markdown'
import { FileIcon } from '@/components/ui/file-icon'
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
import type { RuntimeMessage } from '../../features/runtime-workbench/types'

interface SessionMarkdownProps {
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
    <div className="flex size-8 shrink-0 items-center justify-center rounded-radius-full bg-surface-accent text-text-on-accent">
      <Bot className="size-4" />
    </div>
  )
}

export function UserAvatar() {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-radius-full bg-surface-tertiary text-text-secondary">
      <User className="size-4" />
    </div>
  )
}

export function SessionMarkdown({
  content,
  streaming = false,
  components,
}: SessionMarkdownProps) {
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

export function RuntimeAttachmentList({ message }: { message: RuntimeMessage }) {
  if (!message.files?.length) {
    return null
  }

  return (
    <div className="mt-space-sm flex flex-wrap gap-space-sm">
      {message.files.map((file, index) => (
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
