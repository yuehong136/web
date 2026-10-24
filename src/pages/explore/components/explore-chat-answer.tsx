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
  return (
    <AppChatAnswer
      {...props}
      onViewReference={(chunk, references) =>
        workspace?.viewReference(chunk, references, props.messageId)
      }
    />
  )
}
