import { useRef } from 'react'
import type { SenderRef } from '@ant-design/x/es/sender/interface'
import { useTranslation } from 'react-i18next'
import { RecommendCards } from './RecommendCards'
import { HomeComposer } from './home-composer'
import { RecentAppConversations } from '@/pages/home/components/recent-app-conversations'
import { recommendCards } from '../constants'
import { getGreetingKey } from '../utils'

interface WelcomeSectionProps {
  inputValue: string
  onInputChange: (value: string) => void
  onSend: () => void
  isSendPending?: boolean
}
export function WelcomeSection({
  inputValue,
  onInputChange,
  onSend,
  isSendPending = false,
}: WelcomeSectionProps) {
  const { t } = useTranslation()
  const composer = useRef<SenderRef>(null)
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-space-md py-space-xl sm:px-space-xl">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-space-xl py-space-xl">
        <div className="space-y-space-sm">
          <p className="text-sm text-text-secondary">{t(getGreetingKey())}</p>
          <h1 className="text-3xl leading-tight font-semibold text-text-primary sm:text-4xl">
            {t('home.workspace.title')}
          </h1>
          <p className="max-w-prose text-base leading-relaxed text-text-secondary">
            {t('home.workspace.description')}
          </p>
        </div>
        <HomeComposer
          inputRef={composer}
          value={inputValue}
          onChange={onInputChange}
          onSend={onSend}
          placement="welcome"
          request={{ phase: isSendPending ? 'preparing' : 'idle' }}
        />
        <RecommendCards
          cards={recommendCards}
          onCardClick={(prompt) => {
            onInputChange(prompt)
            composer.current?.focus()
          }}
        />
        <RecentAppConversations />
      </div>
    </div>
  )
}
