import { useTranslation } from 'react-i18next'
import { ChatBubbleLoading } from '@/components/chat/ChatBubbleLoading'
import { MessageActionsFooter } from '@/components/chat/MessageActionsFooter'
import {
  getAppChatMessageParts,
  type AppChatIdentity,
} from '@/components/chat/app-chat-message'
import {
  ChatTranscript,
  type TranscriptItem,
} from '@/components/chat/chat-transcript'
import { copyToClipboardWithFeedback } from '@/lib/clipboard'
import type { RunPhase } from '@/lib/streaming'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import type { CreateAppPageController } from '../hooks/use-create-app-page'
import { PreviewAnswer } from './preview-answer'

type PreviewMessage = CreateAppPageController['previewMessages'][number]

export interface PreviewThreadProps {
  messages: PreviewMessage[]
  app?: AppChatIdentity
  isStreaming: boolean
  status: CreateAppPageController['status']
  /** The answer the reader stopped here, before the service confirmed it. */
  stoppedMessageId: string | null
  /** Regenerating needs the saved draft to be the one under test. */
  canRegenerate: boolean
  onRegenerate: () => void
  onViewReference: (chunk: ReferenceChunk, references: ReferenceChunk[]) => void
}

/**
 * Studio's test chat in the shared thread look, speaking as the app: its
 * avatar beside answers and the model above them. The opening message has
 * no actions; only the latest answer can be regenerated.
 */
export function PreviewThread({
  messages,
  app,
  isStreaming,
  status,
  stoppedMessageId,
  canRegenerate,
  onRegenerate,
  onViewReference,
}: PreviewThreadProps) {
  const { t } = useTranslation()
  const lastAssistant = messages.findLastIndex(
    (message) => message.role === 'assistant',
  )
  const phaseOf = (message: PreviewMessage, index: number): RunPhase =>
    isStreaming && index === lastAssistant
      ? 'running'
      : index !== lastAssistant
        ? 'completed'
        : status === 'failed'
          ? 'failed'
          : status === 'interrupted'
            ? stoppedMessageId === message.id
              ? 'locallyStopped'
              : 'interrupted'
            : 'completed'
  const items = messages.map((message, index): TranscriptItem => {
    const active = isStreaming && index === lastAssistant
    const user = message.role === 'user'
    const prologue = message.id.startsWith('prologue-')
    const { avatar, header } = getAppChatMessageParts(
      message.role,
      app,
      message.modelIdentity ?? {},
    )
    return {
      id: message.id,
      role: message.role,
      phase: active ? 'running' : undefined,
      avatar,
      body: user ? (
        message.content
      ) : (
        <>
          {header}
          {active && !message.content && !message.thinking ? (
            <ChatBubbleLoading />
          ) : (
            <PreviewAnswer
              content={message.content}
              thinking={message.thinking}
              messageId={message.id}
              references={message.references}
              isStreaming={active}
              runPhase={phaseOf(message, index)}
              onViewReference={onViewReference}
            />
          )}
        </>
      ),
      actions:
        !user && !active && message.content && !prologue ? (
          <MessageActionsFooter
            className="flex"
            content={message.content}
            showTTS={false}
            showFeedback={false}
            showRegenerate={canRegenerate && index === lastAssistant}
            onRegenerate={onRegenerate}
            onCopy={() =>
              void copyToClipboardWithFeedback(
                message.content,
                t('common.copied'),
                t('common.copyFailed'),
              )
            }
          />
        ) : undefined,
    }
  })
  return <ChatTranscript items={items} />
}
