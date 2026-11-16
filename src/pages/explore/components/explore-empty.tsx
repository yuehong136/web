import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Code2, Languages, ListChecks, Lightbulb } from 'lucide-react'
import { ChatEmptyState } from '@/components/chat/chat-empty-state'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import type { DialogApp } from '@/types/api'
import { ExploreChatAnswer } from './explore-chat-answer'

const STARTERS = [
  ['explain', Lightbulb],
  ['code', Code2],
  ['summarize', ListChecks],
  ['translate', Languages],
] as const

/** A new conversation with the app: who answers, its opening message, starters. */
export function ExploreEmpty({
  app,
  composer,
  onSuggestion,
}: {
  app?: DialogApp
  composer: ReactNode
  onSuggestion: (prompt: string) => void
}) {
  const { t } = useTranslation()
  const prologue = app?.prompt_config?.prologue?.trim()
  const name = app?.name || t('explore.assistantFallback')
  return (
    <ChatEmptyState
      leading={
        <EntityAvatar name={name} src={app?.icon} seed={app?.id} size="lg" />
      }
      title={name}
      description={app?.description || t('explore.welcomeDescription')}
      intro={
        prologue ? (
          <div className="pt-space-sm text-text-secondary">
            {/* The opening message is app content (Markdown), not product copy. */}
            <ExploreChatAnswer content={prologue} isStreaming={false} />
          </div>
        ) : undefined
      }
      composer={composer}
      suggestionsLabel={t('explore.empty.suggestions')}
      // Starters fill the draft, so they only show with a composer.
      suggestions={(composer ? STARTERS : []).map(([key, Icon]) => {
        const label = t(`explore.prompts.${key}.label`)
        return {
          id: key,
          label,
          prompt: label,
          icon: <Icon aria-hidden="true" />,
        }
      })}
      onSuggestion={onSuggestion}
    />
  )
}
