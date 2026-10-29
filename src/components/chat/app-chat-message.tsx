import type { ModelIdentitySnapshot } from '@/lib/model-identity'
import { ModelIdentity } from '@/components/models/model-identity'
import type { BubbleProps } from '@ant-design/x'
import { Bot } from 'lucide-react'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { useCurrentUserAvatar } from '@/hooks/use-current-user-avatar'
import { ChatBubbleLoading } from '@/components/chat/ChatBubbleLoading'
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

/** Shared by application conversations and the Studio test chat. */
export function getAppChatBubbleProps(
  role: 'user' | 'assistant',
  app?: AppChatIdentity,
  modelIdentity?: ModelIdentitySnapshot,
) {
  const user = role === 'user'
  return {
    header:
      !user && (app?.llm_id || modelIdentity) ? (
        <ModelIdentity {...(modelIdentity ?? { reference: app?.llm_id })} />
      ) : undefined,
    placement: user ? 'end' : 'start',
    variant: 'borderless',
    avatar: <AppChatAvatar role={role} {...app} />,
    footerPlacement: user ? undefined : 'outer-start',
    loadingRender: () => <ChatBubbleLoading />,
    styles: {
      content: user
        ? {
            backgroundColor: 'var(--color-chat-bubble-user-bg)',
            color: 'var(--color-chat-bubble-user-text)',
            borderRadius: '18px',
            padding: '12px 16px',
            boxShadow: 'var(--shadow-sm)',
            maxWidth: 'min(640px, 100%)',
            overflowWrap: 'anywhere',
          }
        : {
            backgroundColor: 'transparent',
            color: 'var(--color-text-primary)',
            borderRadius: '0',
            padding: '0',
            border: 'none',
            boxShadow: 'none',
            overflowWrap: 'anywhere',
          },
    },
  } satisfies Pick<
    BubbleProps,
    | 'header'
    | 'placement'
    | 'variant'
    | 'avatar'
    | 'footerPlacement'
    | 'styles'
    | 'loadingRender'
  >
}
