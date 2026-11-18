import { History, Maximize2, Minimize2, SquarePen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { ProviderLogo } from '@/components/patterns/provider-logo'
import { ResourceCard } from '@/components/patterns/resource-card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useFetchMyLLMs } from '@/hooks/use-llm-request'
import type { HomeLocalThread } from '../hooks/use-home-local-threads'
import { useHomeChatOptions } from '../hooks/use-home-chat-options'
import { homeMessageIdentity } from '../utils/model-identity'
import { ContinueSection, useRelativeTime } from './continue-section'

/** The model that answered last, for the thread's identity. */
function useThreadModel(thread: HomeLocalThread) {
  const { myLLMs } = useFetchMyLLMs()
  const answer = thread.messages.findLast(
    (message) => message.role === 'assistant',
  )
  return answer
    ? homeMessageIdentity(
        answer.contextManifest,
        myLLMs ?? {},
        answer.modelIdentity,
      )
    : { label: undefined, provider: undefined }
}

function LocalThreadCard({
  thread,
  onOpen,
}: {
  thread: HomeLocalThread
  onOpen: (id: string) => void
}) {
  const { t } = useTranslation()
  const relativeTime = useRelativeTime()
  const model = useThreadModel(thread)
  return (
    <ResourceCard
      name={thread.title}
      leading={
        model.provider ? (
          <ProviderLogo provider={model.provider} size="lg" />
        ) : (
          <EntityAvatar name={thread.title} kind="chat" tone="kind" size="lg" />
        )
      }
      eyebrow={[model.label, relativeTime(thread.updatedAt)]
        .filter(Boolean)
        .join(' · ')}
      meta={t('home.continue.messages', { count: thread.messages.length })}
      onOpen={() => onOpen(thread.id)}
    />
  )
}

/** New chat page: this visit's model and MCP conversations, newest first. */
export function LocalThreadCards({
  threads,
  onOpen,
}: {
  threads: HomeLocalThread[]
  onOpen: (id: string) => void
}) {
  const { t } = useTranslation()
  if (!threads.length) return null
  return (
    <ContinueSection title={t('home.localThreads.title')}>
      {threads.slice(0, 3).map((thread) => (
        <LocalThreadCard key={thread.id} thread={thread} onOpen={onOpen} />
      ))}
    </ContinueSection>
  )
}

/**
 * Conversation header actions: reading width, and for model and MCP chats
 * this visit's other conversations and a new chat.
 */
export function HomeThreadActions({
  threads,
  onOpen,
  onNewChat,
}: {
  threads: HomeLocalThread[]
  onOpen: (id: string) => void
  onNewChat?: () => void
}) {
  const { t } = useTranslation()
  const relativeTime = useRelativeTime()
  const fullWidth = useHomeChatOptions((state) => state.fullWidth)
  const setFullWidth = useHomeChatOptions((state) => state.setFullWidth)
  const widthLabel = t(
    fullWidth ? 'home.thread.readingWidth' : 'home.thread.fullWidth',
  )
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="hidden md:inline-flex"
        aria-pressed={fullWidth}
        aria-label={t('home.thread.fullWidth')}
        title={widthLabel}
        onClick={() => setFullWidth(!fullWidth)}
      >
        {fullWidth ? (
          <Minimize2 aria-hidden="true" className="size-icon-sm" />
        ) : (
          <Maximize2 aria-hidden="true" className="size-icon-sm" />
        )}
      </Button>
      {threads.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('home.localThreads.open')}
              title={t('home.localThreads.open')}
            >
              <History aria-hidden="true" className="size-icon-sm" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-w-80">
            <DropdownMenuLabel>
              {t('home.localThreads.title')}
            </DropdownMenuLabel>
            {threads.map((thread) => (
              <DropdownMenuItem
                key={thread.id}
                onClick={() => onOpen(thread.id)}
              >
                <span className="min-w-0 flex-1 truncate">{thread.title}</span>
                <span className="shrink-0 text-xs text-fg-subtle">
                  {relativeTime(thread.updatedAt)}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {onNewChat && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('home.localThreads.newChat')}
          title={t('home.localThreads.newChat')}
          onClick={onNewChat}
        >
          <SquarePen aria-hidden="true" className="size-icon-sm" />
        </Button>
      )}
    </>
  )
}
