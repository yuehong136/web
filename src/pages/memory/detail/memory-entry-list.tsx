import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowUpRight,
  Bot,
  ChevronRight,
  History,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Switch } from '@/components/ui/switch'
import { PageEmptyState } from '@/components/patterns/page-states'
import { StatusDot, type StatusDotTone } from '@/components/studio'
import { MemoryTypeBadge } from '@/components/memory/memory-labels'
import {
  getMemoryEntries,
  getMemoryLifecycle,
  type MemoryLifecycle,
} from '@/components/memory/memory-lifecycle'
import { cn } from '@/lib/utils'
import { editableMemoryId } from '@/hooks/use-memory-revisions'
import type { MemoryMessage } from '@/types/memory'

export type MemoryView = 'memories' | 'sources'
export type MemoryStateFilter = 'all' | MemoryLifecycle

const TONE: Record<MemoryLifecycle, StatusDotTone> = {
  enabled: 'success',
  disabled: 'neutral',
  forgotten: 'warning',
}

/** A record's lifecycle as a status dot with its label. */
export function MemoryLifecycleDot({ message }: { message: MemoryMessage }) {
  const { t } = useTranslation()
  const state = getMemoryLifecycle(message)
  return <StatusDot tone={TONE[state]} label={t(`memory.workspace.${state}`)} />
}

/** The records a view lists: extracted memories, or the conversation sources. */
export function getMemoryViewItems(sources: MemoryMessage[], view: MemoryView) {
  return view === 'memories'
    ? getMemoryEntries(sources)
    : sources.map((message) => ({ message, source: message }))
}

/** Records per lifecycle state in a view, for the state filter's counts. */
export function countMemoryStates(sources: MemoryMessage[], view: MemoryView) {
  const counts: Record<MemoryStateFilter, number> = {
    all: 0,
    enabled: 0,
    disabled: 0,
    forgotten: 0,
  }
  for (const { message } of getMemoryViewItems(sources, view)) {
    counts.all += 1
    counts[getMemoryLifecycle(message)] += 1
  }
  return counts
}

export interface MemoryEntryListProps {
  sources: MemoryMessage[]
  view: MemoryView
  state: MemoryStateFilter
  managed?: boolean
  readOnly?: boolean
  busy: boolean
  onInspect: (message: MemoryMessage) => void
  onStatusChange: (id: number, status: boolean) => void
  onForget: (id: number) => Promise<unknown>
}

/**
 * Extracted memories or conversation sources as cards: id, type and status
 * on the first line, the content (opens the inspector), then who and when.
 * Each record keeps its own switch and forget action.
 */
export function MemoryEntryList({
  sources,
  view,
  state,
  managed = false,
  readOnly = false,
  busy,
  onInspect,
  onStatusChange,
  onForget,
}: MemoryEntryListProps) {
  const { t } = useTranslation()
  const [forgetting, setForgetting] = useState<MemoryMessage | null>(null)
  const entries = getMemoryViewItems(sources, view).filter(
    ({ message }) => state === 'all' || getMemoryLifecycle(message) === state,
  )
  return (
    <>
      {entries.length === 0 ? (
        <PageEmptyState
          title={t('memory.workspace.noEntries')}
          description={t('memory.workspace.noEntriesDescription')}
          icon={<Sparkles className="size-icon-lg" />}
        />
      ) : (
        <ul
          aria-label={t(
            view === 'memories'
              ? 'memory.workspace.memories'
              : 'memory.workspace.sources',
          )}
          className="flex flex-col gap-space-sm"
        >
          {entries.map(({ message, source }) => {
            const lifecycle = getMemoryLifecycle(message)
            const forgotten = lifecycle === 'forgotten'
            const controlsDisabled =
              forgotten ||
              busy ||
              readOnly ||
              !editableMemoryId(message.message_id)
            return (
              <li key={message.message_id}>
                <article
                  data-lifecycle={lifecycle}
                  className="flex flex-col gap-space-xs rounded-radius-xl border border-line-subtle bg-surface px-space-base py-space-sm transition-colors hover:border-line motion-reduce:transition-none"
                >
                  <div className="flex flex-wrap items-center gap-x-space-sm gap-y-space-xs">
                    <span className="font-mono text-xs text-fg-muted tabular-nums">
                      #{message.message_id}
                    </span>
                    <MemoryTypeBadge type={message.message_type} />
                    <MemoryLifecycleDot message={message} />
                    <span className="flex-1" aria-hidden="true" />
                    {view === 'memories' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-fg-muted"
                        onClick={() => onInspect(source)}
                      >
                        {t('memory.workspace.source')}
                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-icon-xs"
                        />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('memory.detail.forgetMessage', {
                        id: message.message_id,
                      })}
                      title={t('memory.messages.forget')}
                      disabled={controlsDisabled}
                      onClick={() => setForgetting(message)}
                    >
                      <History aria-hidden="true" className="size-icon-sm" />
                    </Button>
                    <Switch
                      checked={message.status}
                      disabled={controlsDisabled}
                      aria-label={t('memory.workspace.toggleMessage', {
                        id: message.message_id,
                      })}
                      onCheckedChange={(status) =>
                        onStatusChange(message.message_id, status)
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className={cn(
                      'block w-full rounded-radius-sm text-left text-sm leading-relaxed outline-hidden focus-visible:ring-2 focus-visible:ring-line-focus',
                      lifecycle === 'enabled' ? 'text-fg' : 'text-fg-muted',
                    )}
                    onClick={() => onInspect(message)}
                  >
                    {view === 'memories' ? (
                      <span className="line-clamp-3 break-words">
                        {message.content || t('memory.workspace.noContent')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-space-sm font-medium">
                        <MessageSquare
                          aria-hidden="true"
                          className="size-icon-sm shrink-0 text-fg-subtle"
                        />
                        <span className="truncate font-mono text-xs">
                          {message.session_id}
                        </span>
                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-icon-xs shrink-0 text-fg-subtle"
                        />
                      </span>
                    )}
                  </button>
                  <div className="flex flex-wrap items-center gap-x-space-sm gap-y-space-xs text-xs text-fg-subtle">
                    <span className="flex max-w-48 min-w-0 items-center gap-space-xs">
                      <Bot
                        aria-hidden="true"
                        className="size-icon-xs shrink-0"
                      />
                      <span className="truncate">
                        {source.agent_name || source.agent_id || '—'}
                      </span>
                    </span>
                    <time className="tabular-nums">{message.valid_at}</time>
                    {forgotten && (
                      <span className="tabular-nums">
                        {t('memory.messages.forgetAt')} {message.forget_at}
                      </span>
                    )}
                  </div>
                  {view === 'sources' && !!message.extract?.length && (
                    <details className="group text-xs text-fg-muted">
                      <summary className="flex w-fit cursor-pointer list-none items-center gap-space-xs rounded-radius-sm py-space-2xs outline-hidden hover:text-fg focus-visible:ring-2 focus-visible:ring-line-focus [&::-webkit-details-marker]:hidden">
                        <ChevronRight
                          aria-hidden="true"
                          className="size-icon-xs transition-transform group-open:rotate-90 motion-reduce:transition-none"
                        />
                        {t('memory.workspace.extractCount', {
                          count: message.extract.length,
                        })}
                      </summary>
                      <ul className="mt-space-xs flex flex-col gap-space-xs border-l border-line pl-space-base">
                        {message.extract.map((extract) => (
                          <li key={extract.message_id}>
                            <button
                              type="button"
                              onClick={() => onInspect(extract)}
                              className="flex w-full items-start justify-between gap-space-sm rounded-radius-md bg-sunken p-space-sm text-left outline-hidden hover:bg-fill-hover focus-visible:ring-2 focus-visible:ring-line-focus"
                            >
                              <span className="line-clamp-2 break-words text-fg">
                                {extract.content ||
                                  t('memory.workspace.noContent')}
                              </span>
                              <MemoryLifecycleDot message={extract} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </article>
              </li>
            )
          })}
        </ul>
      )}
      <ConfirmDialog
        open={!!forgetting}
        onOpenChange={(open) => {
          if (!open && !busy) setForgetting(null)
        }}
        variant="destructive"
        pending={busy}
        title={t('memory.messages.forgetTitle')}
        description={t(
          managed
            ? forgetting?.message_type === 'raw'
              ? 'memory.revisions.withdrawScope'
              : 'memory.revisions.managedForgetScope'
            : 'memory.revisions.legacyForgetScope',
        )}
        cancelLabel={t('common.cancel')}
        confirmLabel={busy ? t('common.loading') : t('memory.messages.forget')}
        onConfirm={async () => {
          if (!forgetting) return
          try {
            await onForget(forgetting.message_id)
            setForgetting(null)
          } catch {
            /* The mutation owns feedback; retain the selected record for retry. */
          }
        }}
      />
    </>
  )
}
