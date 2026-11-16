import { useTranslation } from 'react-i18next'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { ResourceCard } from '@/components/patterns/resource-card'
import { useFetchConversationsByDialog } from '@/hooks/use-chat-request'
import { useHomeStore } from '@/stores/home'
import { ContinueSection, useRelativeTime } from './continue-section'

/** Continue an existing app conversation using its real server summary. */
export function RecentAppConversations() {
  const { t } = useTranslation()
  const relativeTime = useRelativeTime()
  const app = useHomeStore((state) => state.selectedApps[0])
  const selectConversation = useHomeStore((state) => state.selectConversation)
  const { conversations, isLoading, isError } = useFetchConversationsByDialog(
    app?.id,
  )
  if (!app || isLoading || isError || !conversations.length) return null
  return (
    <ContinueSection
      title={t('home.skillPanel.historyTitle', { name: app.name })}
    >
      {[...conversations]
        .sort((first, second) => second.update_time - first.update_time)
        .slice(0, 3)
        .map((conversation) => (
          <ResourceCard
            key={conversation.id}
            name={
              conversation.name ||
              conversation.title ||
              t('home.skillPanel.unnamedConversation')
            }
            // The app answers these conversations, so its identity leads the card.
            leading={
              <EntityAvatar
                name={app.name}
                src={app.icon}
                seed={app.id}
                badge="chat"
                size="lg"
              />
            }
            eyebrow={[
              app.name,
              relativeTime(
                conversation.update_time || conversation.update_date,
              ),
            ]
              .filter(Boolean)
              .join(' · ')}
            meta={
              conversation.message_count
                ? t('home.continue.messages', {
                    count: conversation.message_count,
                  })
                : undefined
            }
            onOpen={() => selectConversation(conversation.id)}
          />
        ))}
    </ContinueSection>
  )
}
