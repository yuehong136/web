import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatRelativeTime } from '@/lib/utils'
import {
  extractSessionStatus,
  type AgentSessionRuntimeStatus,
} from '../../adapters/session'
import type { ExploreSession } from '../types'
import { Trash2 } from 'lucide-react'

interface SessionCardProps {
  session: ExploreSession
  selected: boolean
  disabled?: boolean
  onSelect: () => void
  onDelete: () => void
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

export function SessionCard({
  session,
  selected,
  disabled,
  onSelect,
  onDelete,
}: SessionCardProps) {
  const status = extractSessionStatus(session)

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'group w-full rounded-radius-lg border p-space-base text-left transition-colors',
        selected
          ? 'border-state-focus bg-surface-secondary'
          : 'border-border-default hover:bg-surface-secondary',
      )}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
    >
      <div className="flex items-start justify-between gap-space-sm">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text-primary">
            {session.isTemporary ? '新会话' : session.name || '未命名会话'}
          </p>
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
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            className="opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
            title="删除会话"
            aria-label="删除会话"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      <div className="mt-space-sm flex items-center justify-between gap-space-sm text-xs text-text-tertiary">
        <span>{session.isTemporary ? '首次发送后创建' : session.id}</span>
        <span className="rounded-radius-full bg-surface-primary px-space-sm py-[2px] text-text-secondary">
          {session.message_count || session.messages?.length || 0}
        </span>
      </div>
    </div>
  )
}
