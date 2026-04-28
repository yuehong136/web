import { Badge } from '@/components/ui/badge'
import { JsonViewer } from '../../../form/components/json-viewer'
import {
  Bot,
  Braces,
  CircleCheck,
  Database,
  GitBranch,
  Loader2,
  OctagonAlert,
  Wrench,
  XCircle,
} from 'lucide-react'

export const STATUS_LABEL_MAP: Record<string, string> = {
  loading: '运行中',
  success: '已完成',
  error: '失败',
  abort: '已停止',
}

export const STATUS_BADGE_MAP: Record<
  string,
  'success' | 'destructive' | 'warning' | 'outline'
> = {
  loading: 'warning',
  success: 'success',
  error: 'destructive',
  abort: 'outline',
}

export const ACTION_BADGE_MAP: Record<
  string,
  'blue' | 'purple' | 'orange' | 'green' | 'secondary'
> = {
  action: 'purple',
  tool: 'blue',
  control: 'orange',
  data: 'green',
  system: 'secondary',
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const stringifyValue = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export const summarizeValue = (value: unknown, fallback: string) => {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  if (Array.isArray(value)) {
    return `${value.length} 项`
  }

  if (isRecord(value)) {
    const rawKeys = Object.keys(value)
    const keys = rawKeys.filter((key) => !key.startsWith('_'))
    if (!keys.length) {
      return rawKeys.length ? '系统元数据' : fallback
    }

    const preview = keys.slice(0, 3).join(', ')
    return keys.length > 3 ? `${keys.length} 字段 · ${preview}...` : preview
  }

  return String(value).slice(0, 80)
}

export const getActionIcon = (kind: string) => {
  if (kind === 'tool') {
    return Wrench
  }

  if (kind === 'control') {
    return GitBranch
  }

  if (kind === 'data') {
    return Database
  }

  if (kind === 'system') {
    return Braces
  }

  return Bot
}

export const getStatusIcon = (status: string) => {
  if (status === 'loading') {
    return Loader2
  }

  if (status === 'success') {
    return CircleCheck
  }

  if (status === 'error') {
    return OctagonAlert
  }

  return XCircle
}

export function RuntimeThoughtPayload({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: unknown
  tone?: 'default' | 'error'
}) {
  const content = stringifyValue(value)

  if (!content) {
    return null
  }

  return (
    <div className="space-y-space-xs rounded-radius-md border border-border-subtle bg-surface-secondary p-space-sm">
      <div
        className={
          tone === 'error'
            ? 'text-xs font-medium text-status-error'
            : 'text-xs font-medium text-text-secondary'
        }
      >
        {label}
      </div>
      {isRecord(value) || Array.isArray(value) ? (
        <JsonViewer
          data={value}
          className={
            tone === 'error'
              ? 'max-h-44 max-w-full whitespace-pre-wrap break-words bg-status-error/10 text-status-error'
              : 'max-h-44 max-w-full whitespace-pre-wrap break-words bg-surface-primary text-text-secondary'
          }
        />
      ) : (
        <pre
          className={
            tone === 'error'
              ? 'max-h-44 max-w-full overflow-auto whitespace-pre-wrap break-words rounded-radius-sm bg-status-error/10 p-space-sm text-xs text-status-error'
              : 'max-h-44 max-w-full overflow-auto whitespace-pre-wrap break-words rounded-radius-sm bg-surface-primary p-space-sm text-xs text-text-secondary'
          }
        >
          {content}
        </pre>
      )}
    </div>
  )
}

export function RuntimeStatusBadge({ status }: { status: string }) {
  const StatusIcon = getStatusIcon(status)

  return (
    <Badge variant={STATUS_BADGE_MAP[status]} className="gap-space-xs">
      <StatusIcon
        className={status === 'loading' ? 'size-3 animate-spin' : 'size-3'}
      />
      {STATUS_LABEL_MAP[status]}
    </Badge>
  )
}
