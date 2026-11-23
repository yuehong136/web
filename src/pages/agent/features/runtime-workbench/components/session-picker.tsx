import { Badge, badgeLook } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useFetchAgentSessions } from '@/hooks/use-agent-request'
import { cn, formatRelativeTime } from '@/lib/utils'
import {
  extractSessionStatus,
  type AgentSessionRuntimeStatus,
} from '@/pages/agent/adapters/session'
import { ChevronsUpDown } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'

interface SessionPickerProps {
  canvasId?: string
  currentSessionId?: string
  viewingSessionId?: string
  onSelect: (id: string | undefined) => void
}

const STATUS_LABEL_KEY_MAP = {
  success: 'agent.logDetail.status.success',
  error: 'agent.logDetail.status.error',
  unknown: 'agent.logDetail.status.unknown',
} as const satisfies Record<AgentSessionRuntimeStatus, string>

const STATUS_VARIANT_MAP: Record<
  AgentSessionRuntimeStatus,
  'success' | 'destructive' | 'outline'
> = {
  success: 'success',
  error: 'destructive',
  unknown: 'outline',
}

export function SessionPicker({
  canvasId,
  currentSessionId,
  viewingSessionId,
  onSelect,
}: SessionPickerProps) {
  const { t } = useTranslation()
  const idPrefix = useId()
  const sessionsQuery = useFetchAgentSessions(canvasId)
  const sessions = sessionsQuery.data.sessions.slice(0, 12)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          {t('agent.runtimePanel.sessionPicker.trigger')}
          <ChevronsUpDown className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-space-sm">
        <div className="mb-space-sm flex items-center justify-between gap-space-sm">
          <div>
            <p className="text-sm font-medium text-fg">
              {t('agent.runtimePanel.sessionPicker.recentSessions')}
            </p>
            <p className="text-xs text-fg-subtle">
              {t('agent.runtimePanel.sessionPicker.hint')}
            </p>
          </div>
          {viewingSessionId ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSelect(undefined)}
            >
              {t('agent.runtimePanel.sessionPicker.backToLive')}
            </Button>
          ) : null}
        </div>

        <ScrollArea className="max-h-[360px]">
          <div className="space-y-space-xs">
            {sessions.length ? (
              sessions.map((session) => {
                const status = extractSessionStatus(session)
                const active = viewingSessionId === session.id
                const current = currentSessionId === session.id
                const nameId = `${idPrefix}-${session.id}-name`

                return (
                  <button
                    key={session.id}
                    type="button"
                    aria-labelledby={nameId}
                    aria-pressed={active}
                    className={cn(
                      'w-full rounded-radius-md border p-space-sm text-left transition-colors',
                      active
                        ? 'border-line-focus bg-sunken'
                        : 'border-line hover:bg-sunken',
                    )}
                    onClick={() => onSelect(session.id)}
                  >
                    <div className="flex items-start justify-between gap-space-sm">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-space-xs">
                          <p
                            id={nameId}
                            className="truncate text-sm font-medium text-fg"
                          >
                            {session.name ||
                              t(
                                'agent.runtimePanel.sessionPicker.unnamedSession',
                              )}
                          </p>
                          {current ? (
                            <Badge variant="outline" className="shrink-0">
                              {t('agent.runtimePanel.sessionPicker.liveBadge')}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-space-xs text-xs text-fg-subtle">
                          {session.update_time
                            ? formatRelativeTime(session.update_time)
                            : t('agent.runtimePanel.sessionPicker.noTime')}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-space-xs">
                        <Badge {...badgeLook(STATUS_VARIANT_MAP[status])}>
                          {t(STATUS_LABEL_KEY_MAP[status])}
                        </Badge>
                        <span className="rounded-radius-full bg-sunken px-space-sm py-[2px] text-xs text-fg-muted">
                          {session.message_count ||
                            session.messages?.length ||
                            0}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })
            ) : (
              <p className="py-space-xl text-center text-sm text-fg-muted">
                {t('agent.runtimePanel.sessionPicker.empty')}
              </p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
