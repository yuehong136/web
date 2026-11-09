import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowUpRight,
  Bot,
  History,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { PageEmptyState } from '@/components/patterns/page-states'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MemoryStatusBadge, MemoryTypeBadge } from './memory-labels'
import {
  getMemoryEntries,
  getMemoryLifecycle,
  type MemoryLifecycle,
} from './memory-lifecycle'
import type { MemoryMessage } from '@/types/memory'

export function MemoryMessageFeed({
  sources,
  view,
  state,
  busy,
  onInspect,
  onStatusChange,
  onForget,
}: {
  sources: MemoryMessage[]
  view: 'memories' | 'sources'
  state: 'all' | MemoryLifecycle
  busy: boolean
  onInspect: (message: MemoryMessage) => void
  onStatusChange: (id: number, status: boolean) => void
  onForget: (id: number) => Promise<unknown>
}) {
  const { t } = useTranslation()
  const [forgetting, setForgetting] = useState<MemoryMessage | null>(null)
  const matches = (message: MemoryMessage) =>
    state === 'all' || getMemoryLifecycle(message) === state
  const entries =
    view === 'memories'
      ? getMemoryEntries(sources).filter(({ message }) => matches(message))
      : sources.filter(matches).map((message) => ({ message, source: message }))
  return (
    <>
      {entries.length === 0 ? (
        <PageEmptyState
          title={t('memory.workspace.noEntries')}
          description={t('memory.workspace.noEntriesDescription')}
          icon={<Sparkles className="size-icon-lg" />}
        />
      ) : (
        <div className="divide-y divide-border-subtle overflow-hidden rounded-radius-lg border border-border-subtle bg-background-surface">
          {entries.map(({ message, source }) => {
            const forgotten = getMemoryLifecycle(message) === 'forgotten'
            return (
              <article
                key={message.message_id}
                className="px-space-base py-space-xs transition-colors hover:bg-state-hover"
              >
                <div className="flex items-center gap-space-base">
                  <div className="min-w-0 flex-1 space-y-space-xs">
                    <button
                      className="block w-full rounded-radius-sm text-left text-sm leading-relaxed text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-state-focus"
                      onClick={() => onInspect(message)}
                    >
                      {view === 'memories' ? (
                        <span className="line-clamp-2 break-words">
                          {message.content || t('memory.workspace.noContent')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-space-sm font-medium">
                          <MessageSquare className="size-icon-sm shrink-0" />
                          <span className="truncate">{message.session_id}</span>
                          <ArrowUpRight className="size-icon-xs shrink-0" />
                        </span>
                      )}
                    </button>
                    <div className="flex flex-wrap items-center gap-x-space-sm gap-y-space-xs text-xs text-text-tertiary">
                      <MemoryTypeBadge type={message.message_type} />
                      <MemoryStatusBadge message={message} />
                      <span className="flex max-w-32 items-center gap-space-xs truncate">
                        <Bot className="size-icon-xs shrink-0" />
                        {source.agent_name || source.agent_id || '—'}
                      </span>
                      <time className="tabular-nums">{message.valid_at}</time>
                      {forgotten && (
                        <span>
                          {t('memory.messages.forgetAt')} {message.forget_at}
                        </span>
                      )}
                      {view === 'memories' && (
                        <button
                          className="inline-flex items-center gap-space-xs text-text-secondary hover:text-text-accent focus-visible:ring-2 focus-visible:ring-state-focus"
                          onClick={() => onInspect(source)}
                        >
                          {t('memory.workspace.source')}
                          <ArrowUpRight className="size-icon-xs" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-space-sm">
                    <Switch
                      checked={message.status}
                      disabled={forgotten || busy}
                      aria-label={t('memory.workspace.toggleMessage', {
                        id: message.message_id,
                      })}
                      onCheckedChange={(status) =>
                        onStatusChange(message.message_id, status)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('memory.messages.forget')}
                      title={t('memory.messages.forget')}
                      disabled={forgotten || busy}
                      onClick={() => setForgetting(message)}
                    >
                      <History className="size-icon-sm" />
                    </Button>
                  </div>
                </div>
                {view === 'sources' && !!message.extract?.length && (
                  <details className="mt-space-xs text-xs text-text-secondary">
                    <summary className="w-fit cursor-pointer rounded-radius-sm py-space-xs focus-visible:ring-2 focus-visible:ring-state-focus">
                      {t('memory.workspace.extractCount', {
                        count: message.extract.length,
                      })}
                    </summary>
                    <div className="mt-space-xs space-y-space-xs border-l border-border-default pl-space-base">
                      {message.extract.map((extract) => (
                        <button
                          key={extract.message_id}
                          onClick={() => onInspect(extract)}
                          className="flex w-full items-start justify-between gap-space-sm rounded-radius-md bg-background-subtle p-space-sm text-left hover:bg-state-hover focus-visible:ring-2 focus-visible:ring-state-focus"
                        >
                          <span className="line-clamp-2 break-words">
                            {extract.content}
                          </span>
                          <MemoryStatusBadge message={extract} />
                        </button>
                      ))}
                    </div>
                  </details>
                )}
              </article>
            )
          })}
        </div>
      )}
      <AlertDialog
        open={!!forgetting}
        onOpenChange={(open) => {
          if (!open && !busy) setForgetting(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('memory.messages.forgetTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('memory.workspace.forgetExplanation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busy}
              onClick={async (event) => {
                event.preventDefault()
                if (!forgetting) return
                try {
                  await onForget(forgetting.message_id)
                  setForgetting(null)
                } catch {
                  /* The mutation owns feedback; retain the selected record for retry. */
                }
              }}
            >
              {busy ? t('common.loading') : t('memory.messages.forget')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
