import { useRef } from 'react'
import type { SenderRef } from '@ant-design/x/es/sender/interface'
import { useTranslation } from 'react-i18next'
import { GitCompareArrows, ListChecks, NotebookPen } from 'lucide-react'
import { ChatEmptyState } from '@/components/chat/chat-empty-state'
import { HomeComposer } from './home-composer'
import { RecentAppConversations } from '@/pages/home/components/recent-app-conversations'
import { recommendCards } from '../constants'

const STARTER_ICONS = [ListChecks, GitCompareArrows, NotebookPen]

interface WelcomeSectionProps {
  inputValue: string
  onInputChange: (value: string) => void
  onSend: () => void
  isSendPending?: boolean
}

/** New chat: a short question, the composer, one row of starters, recent app conversations. */
export function WelcomeSection({
  inputValue,
  onInputChange,
  onSend,
  isSendPending = false,
}: WelcomeSectionProps) {
  const { t } = useTranslation()
  const composer = useRef<SenderRef>(null)
  return (
    <ChatEmptyState
      title={t('home.empty.title')}
      description={t('home.empty.description')}
      composer={
        <HomeComposer
          inputRef={composer}
          value={inputValue}
          onChange={onInputChange}
          onSend={onSend}
          placement="welcome"
          request={{ phase: isSendPending ? 'preparing' : 'idle' }}
        />
      }
      suggestionsLabel={t('home.empty.suggestions')}
      suggestions={recommendCards.map((card, index) => {
        const Icon = STARTER_ICONS[index % STARTER_ICONS.length]
        return {
          id: String(card.id),
          label: card.tagKey ? t(card.tagKey, card.tag) : card.tag,
          prompt: card.titleKey ? t(card.titleKey, card.title) : card.title,
          icon: <Icon aria-hidden="true" />,
        }
      })}
      onSuggestion={(prompt) => {
        onInputChange(prompt)
        composer.current?.focus()
      }}
      footer={<RecentAppConversations />}
    />
  )
}
