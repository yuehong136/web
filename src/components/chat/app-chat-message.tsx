import type { BubbleProps } from '@ant-design/x'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChatBubbleLoading } from '@/components/chat/ChatBubbleLoading'
import '@/components/chat/app-chat-message.css'

export interface AppChatIdentity {
  name?: string
  icon?: string
}
export function AppChatAvatar({
  role,
  name,
  icon,
}: AppChatIdentity & { role: 'user' | 'assistant' }) {
  const source =
    icon &&
    (icon.startsWith('data:') || icon.startsWith('http')
      ? icon
      : `data:image/png;base64,${icon}`)
  return (
    <Avatar
      className="size-8 shrink-0"
      aria-label={role === 'assistant' ? name || 'AI' : undefined}
    >
      {role === 'assistant' && source && (
        <AvatarImage src={source} alt={name || 'AI'} />
      )}
      <AvatarFallback
        className={
          role === 'user'
            ? 'text-sm font-medium'
            : 'text-sm font-bold text-text-inverted'
        }
        style={
          role === 'user'
            ? {
                background: 'var(--color-chat-bubble-user-avatar-bg)',
                color: 'var(--color-chat-bubble-user-avatar-text)',
              }
            : { background: 'var(--color-components-gradient-primary)' }
        }
      >
        {role === 'user' ? 'U' : 'AI'}
      </AvatarFallback>
    </Avatar>
  )
}

/** Shared by application conversations and the Studio test chat. */
export function getAppChatBubbleProps(
  role: 'user' | 'assistant',
  app?: AppChatIdentity,
) {
  const user = role === 'user'
  return {
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
    | 'placement'
    | 'variant'
    | 'avatar'
    | 'footerPlacement'
    | 'styles'
    | 'loadingRender'
  >
}
