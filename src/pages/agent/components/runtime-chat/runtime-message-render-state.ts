import type { RuntimeMessage } from '../../features/runtime-workbench/types'

interface RuntimeMessageRenderableState {
  message: RuntimeMessage
  mainContent: string
  thinkContent?: string
  referencesLength: number
  hasXCard: boolean
}

export function hasRuntimeMessageRenderableContent({
  message,
  mainContent,
  thinkContent,
  referencesLength,
  hasXCard,
}: RuntimeMessageRenderableState) {
  return Boolean(
    mainContent.trim() ||
      thinkContent?.trim() ||
      message.logEvents?.length ||
      hasXCard ||
      message.files?.length ||
      message.awaitingInputs?.length ||
      message.error ||
      message.tips ||
      referencesLength > 0,
  )
}

export function shouldShowRuntimeBubbleLoading(
  state: RuntimeMessageRenderableState,
  isStreaming: boolean,
) {
  return isStreaming && !hasRuntimeMessageRenderableContent(state)
}

export function shouldShowRuntimeMessageFooter({
  isUser,
  isStreaming,
  mainContent,
  useTextTyping,
  typingCompleted,
}: {
  isUser: boolean
  isStreaming: boolean
  mainContent: string
  useTextTyping: boolean
  typingCompleted: boolean
}) {
  return (
    !isUser &&
    !isStreaming &&
    (!useTextTyping || typingCompleted) &&
    Boolean(mainContent.trim())
  )
}
