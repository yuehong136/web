import { useRef, type Ref } from 'react'
import type { ChatComposerRef } from '@/components/chat/chat-composer'
import { useHomeStore } from '@/stores/home'
import { HomeComposer } from './home-composer'
import { HomeGreeting } from './home-greeting'
import { HomeStarters } from './home-starters'
import { HomeRecentWork } from './home-recent-work'
import { RecentAppConversations } from '@/pages/home/components/recent-app-conversations'
import { useHomeOverview } from '../hooks/use-home-overview'
import type { HomeLocalThread } from '../hooks/use-home-local-threads'
import { LocalThreadCards } from './local-threads'

interface WelcomeSectionProps {
  inputValue: string
  onInputChange: (value: string) => void
  onSend: () => void
  isSendPending?: boolean
  /** The composer's frame, measured when the first message leaves it. */
  composerRef?: Ref<HTMLDivElement>
  /** Model and MCP conversations set aside during this visit. */
  localThreads?: HomeLocalThread[]
  onOpenLocalThread?: (id: string) => void
}

/**
 * New chat: the tide greeting and the page heading, the composer as the hero,
 * four starters, then work to pick up again (the selected app's conversations,
 * otherwise this visit's model and MCP chats, then recently updated apps and
 * knowledge bases).
 */
export function WelcomeSection({
  inputValue,
  onInputChange,
  onSend,
  isSendPending = false,
  composerRef,
  localThreads = [],
  onOpenLocalThread,
}: WelcomeSectionProps) {
  const composer = useRef<ChatComposerRef>(null)
  const hasApp = useHomeStore((state) => state.selectedApps.length > 0)
  const overview = useHomeOverview()
  return (
    <div
      data-home-welcome
      className="flex min-h-0 flex-1 flex-col overflow-y-auto ai-halo px-space-sm sm:px-space-lg"
    >
      <div className="mx-auto my-auto flex w-full max-w-2xl flex-col gap-space-lg py-space-xl sm:py-space-2xl">
        <HomeGreeting
          knowledgeTotal={overview.knowledgeTotal}
          mcpTotal={overview.mcpTotal}
        />
        <div ref={composerRef} data-home-composer="welcome">
          <HomeComposer
            inputRef={composer}
            value={inputValue}
            onChange={onInputChange}
            onSend={onSend}
            placement="welcome"
            request={{ phase: isSendPending ? 'preparing' : 'idle' }}
          />
        </div>
        <HomeStarters
          onPick={(prompt) => {
            onInputChange(prompt)
            composer.current?.focus()
          }}
        />
        {hasApp ? (
          <RecentAppConversations />
        ) : (
          <>
            {onOpenLocalThread && (
              <LocalThreadCards
                threads={localThreads}
                onOpen={onOpenLocalThread}
              />
            )}
            <HomeRecentWork
              apps={overview.apps}
              knowledgeBases={overview.knowledgeBases}
              loading={overview.loading}
            />
          </>
        )}
      </div>
    </div>
  )
}
