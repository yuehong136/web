import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useFetchAgentSessions } from '@/hooks/use-agent-request'
import { formatRelativeTime } from '@/lib/utils'
import {
  extractSessionStatus,
  type AgentSessionRuntimeStatus,
} from '@/pages/agent/adapters/session'
import { cn } from '@/lib/utils'
import { ChevronsUpDown } from 'lucide-react'

interface SessionPickerProps {
  canvasId?: string
  currentSessionId?: string
  viewingSessionId?: string
  onSelect: (id: string | undefined) => void
}

const STATUS_LABEL_MAP: Record<AgentSessionRuntimeStatus, string> = {
  success: '成功',
  error: '失败',
  unknown: '未知',
}

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
  const sessionsQuery = useFetchAgentSessions(canvasId)
  const sessions = sessionsQuery.data.sessions.slice(0, 12)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          切换会话
          <ChevronsUpDown className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-space-sm">
        <div className="mb-space-sm flex items-center justify-between gap-space-sm">
          <div>
            <p className="text-sm font-medium text-text-primary">最近会话</p>
            <p className="text-xs text-text-tertiary">
              选择后只切换 Log 查看对象，不影响当前运行流。
            </p>
          </div>
          {viewingSessionId ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSelect(undefined)}
            >
              返回 Live
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

                return (
                  <button
                    key={session.id}
                    type="button"
                    className={cn(
                      'w-full rounded-radius-md border p-space-sm text-left transition-colors',
                      active
                        ? 'border-state-focus bg-surface-secondary'
                        : 'border-border-default hover:bg-surface-secondary',
                    )}
                    onClick={() => onSelect(session.id)}
                  >
                    <div className="flex items-start justify-between gap-space-sm">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-space-xs">
                          <p className="truncate text-sm font-medium text-text-primary">
                            {session.name || '未命名会话'}
                          </p>
                          {current ? (
                            <Badge variant="outline" className="shrink-0">
                              Live
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-space-xs text-xs text-text-tertiary">
                          {session.update_time
                            ? formatRelativeTime(session.update_time)
                            : '暂无时间信息'}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-space-xs">
                        <Badge variant={STATUS_VARIANT_MAP[status]}>
                          {STATUS_LABEL_MAP[status]}
                        </Badge>
                        <span className="rounded-radius-full bg-surface-secondary px-space-sm py-[2px] text-xs text-text-secondary">
                          {session.message_count || session.messages?.length || 0}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })
            ) : (
              <p className="py-space-xl text-center text-sm text-text-secondary">
                暂无历史会话
              </p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
