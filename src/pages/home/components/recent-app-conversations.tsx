import { MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFetchConversationsByDialog } from '@/hooks/use-chat-request'
import { useHomeStore } from '@/stores/home'

/** Continue an existing app conversation using its real server summary. */
export function RecentAppConversations() {
  const { t } = useTranslation()
  const app = useHomeStore((state) => state.selectedApps[0])
  const selectConversation = useHomeStore((state) => state.selectConversation)
  const { conversations, isLoading, isError } = useFetchConversationsByDialog(
    app?.id,
  )
  if (!app || isLoading || isError || !conversations.length) return null
  const title = t('home.skillPanel.historyTitle', { name: app.name })
  return (
    <section aria-label={title} className="space-y-space-sm">
      <h2 className="text-sm font-medium text-text-secondary">{title}</h2>
      <ul className="grid gap-space-xs sm:grid-cols-2">
        {[...conversations]
          .sort((first, second) => second.update_time - first.update_time)
          .slice(0, 4)
          .map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                className="flex w-full items-center gap-space-sm rounded-radius-md px-space-sm py-space-sm text-left text-sm text-text-primary hover:bg-state-hover focus-visible:outline focus-visible:outline-state-focus"
                onClick={() => selectConversation(conversation.id)}
              >
                <MessageSquare
                  className="size-icon-sm shrink-0 text-text-caption"
                  aria-hidden="true"
                />
                <span className="truncate">
                  {conversation.name ||
                    conversation.title ||
                    t('home.skillPanel.unnamedConversation')}
                </span>
              </button>
            </li>
          ))}
      </ul>
    </section>
  )
}
