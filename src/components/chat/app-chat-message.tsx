import type { ModelIdentitySnapshot } from '@/lib/model-identity'
import { Bot } from 'lucide-react'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { useCurrentUserAvatar } from '@/hooks/use-current-user-avatar'
import { AnswerIdentity } from '@/components/chat/answer-identity'
import '@/components/chat/app-chat-message.css'

export interface AppChatIdentity {
  /** App id; keeps the monogram tone it has in the app lists. */
  id?: string
  llm_id?: string
  name?: string
  icon?: string
}

/** The assistant speaks as the app; the user is the signed-in account. */
export function AppChatAvatar({
  role,
  id,
  name,
  icon,
}: AppChatIdentity & { role: 'user' | 'assistant' }) {
  const user = useCurrentUserAvatar()
  return role === 'user' ? (
    <EntityAvatar {...user} shape="circle" />
  ) : (
    <EntityAvatar
      name={name}
      src={icon}
      seed={id}
      shape="circle"
      icon={name ? undefined : <Bot />}
      labelled
    />
  )
}

/** Avatar and answer header for the Studio test chat. */
export function getAppChatMessageParts(
  role: 'user' | 'assistant',
  app?: AppChatIdentity,
  modelIdentity?: ModelIdentitySnapshot,
) {
  const user = role === 'user'
  return {
    header:
      !user && (app?.llm_id || modelIdentity) ? (
        <AnswerIdentity {...(modelIdentity ?? { reference: app?.llm_id })} />
      ) : undefined,
    avatar: <AppChatAvatar role={role} {...app} />,
  }
}
