import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Code2, Languages, ListChecks, Lightbulb } from 'lucide-react'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { cn } from '@/lib/utils'
import type { DialogApp } from '@/types/api'
import { ExploreChatAnswer } from './explore-chat-answer'

const STARTERS = [
  {
    key: 'explain',
    icon: Lightbulb,
    tone: 'bg-avatar-5-bg text-avatar-5-fg',
  },
  {
    key: 'code',
    icon: Code2,
    tone: 'bg-avatar-7-bg text-avatar-7-fg',
  },
  {
    key: 'summarize',
    icon: ListChecks,
    tone: 'bg-avatar-6-bg text-avatar-6-fg',
  },
  {
    key: 'translate',
    icon: Languages,
    tone: 'bg-avatar-2-bg text-avatar-2-fg',
  },
] as const

/**
 * A new conversation with the app: who answers, its opening message, the
 * composer and starters. The app's name is a section heading here; the page
 * heading (h1) is the thread header above.
 */
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
    <div
      data-explore-empty
      className="flex min-h-0 flex-1 flex-col overflow-y-auto px-space-sm sm:px-space-lg"
    >
      <div className="mx-auto my-auto flex w-full max-w-2xl flex-col gap-space-lg py-space-xl">
        <div className="flex flex-col items-center gap-space-sm text-center">
          <EntityAvatar
            name={name}
            src={app?.icon}
            seed={app?.id}
            badge="chat"
            size="xl"
          />
          <h2 className="text-2xl font-semibold tracking-tight text-pretty text-fg">
            {name}
          </h2>
          <p className="max-w-xl text-sm text-pretty text-fg-muted">
            {app?.description || t('explore.welcomeDescription')}
          </p>
        </div>
        {prologue ? (
          <div
            data-explore-prologue
            className="flex items-start gap-space-sm rounded-radius-xl border border-line-subtle bg-surface p-space-md text-fg-muted"
          >
            <EntityAvatar
              name={name}
              src={app?.icon}
              seed={app?.id}
              size="sm"
              className="mt-space-2xs"
            />
            <div className="min-w-0 flex-1">
              {/* The opening message is app content (Markdown), not product copy. */}
              <ExploreChatAnswer content={prologue} isStreaming={false} />
            </div>
          </div>
        ) : null}
        {composer}
        {/* Starters fill the draft, so they only show with a composer. */}
        {composer ? (
          <ul
            aria-label={t('explore.empty.suggestions')}
            className="grid grid-cols-[repeat(auto-fit,minmax(min(9rem,100%),1fr))] gap-space-sm"
          >
            {STARTERS.map(({ key, icon: Icon, tone }) => {
              const label = t(`explore.prompts.${key}.label`)
              return (
                <li key={key} className="min-w-0">
                  <button
                    type="button"
                    title={label}
                    onClick={() => onSuggestion(label)}
                    className="flex h-full w-full items-center gap-space-sm rounded-radius-xl border border-line-subtle bg-surface p-space-sm text-left text-sm font-medium text-fg outline-hidden transition-[border-color,box-shadow,transform] duration-(--motion-fast) hover:border-line-strong hover:shadow-elevation-medium focus-visible:ring-2 focus-visible:ring-line-focus motion-safe:hover:-translate-y-px"
                  >
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-radius-md [&_svg]:size-icon-sm',
                        tone,
                      )}
                    >
                      <Icon aria-hidden="true" />
                    </span>
                    <span className="min-w-0 truncate">{label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
