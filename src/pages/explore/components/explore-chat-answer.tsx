import { useCallback } from 'react'
import {
  AppChatAnswer,
  type AppChatAnswerProps,
} from '@/components/chat/app-chat-answer'
import { useChatWorkspace } from '@/components/chat/chat-workspace-context'

/** Bind source and artifact actions to the page's shared resource workspace. */
export function ExploreChatAnswer(
  props: Omit<AppChatAnswerProps, 'onViewReference'>,
) {
  const workspace = useChatWorkspace()
  const { messageId } = props
  const viewReference = useCallback<AppChatAnswerProps['onViewReference']>(
    (chunk, references, options) =>
      workspace?.viewReference(chunk, references, messageId, options),
    [workspace, messageId],
  )
  return <AppChatAnswer {...props} onViewReference={viewReference} />
}
