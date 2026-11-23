import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Badge, badgeLook } from '@/components/ui/badge'
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

export const STATUS_LABEL_KEY_MAP: Record<string, string> = {
  loading: 'agent.runtime.running',
  success: 'agent.runtime.success',
  error: 'agent.runtime.error',
  abort: 'agent.runtime.stopped',
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

export const summarizeValue = (
  value: unknown,
  fallback: string,
  t: TFunction,
) => {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  if (Array.isArray(value)) {
    return t('agent.runtimePanel.thoughtChain.itemCount', {
      count: value.length,
    })
  }

  if (isRecord(value)) {
    const rawKeys = Object.keys(value)
    const keys = rawKeys.filter((key) => !key.startsWith('_'))
    if (!keys.length) {
      return rawKeys.length
        ? t('agent.runtimePanel.thoughtChain.systemMetadata')
        : fallback
    }

    const preview = keys.slice(0, 3).join(', ')
    return keys.length > 3
      ? t('agent.runtimePanel.thoughtChain.fieldSummary', {
          count: keys.length,
          preview,
        })
      : preview
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

const STATUS_ICONS: Record<string, typeof Loader2> = {
  loading: Loader2,
  success: CircleCheck,
  error: OctagonAlert,
  abort: XCircle,
}

export const getStatusIcon = (status: string) => STATUS_ICONS[status] || XCircle

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
    <div className="space-y-space-xs rounded-radius-md border border-line-subtle bg-sunken p-space-sm">
      <div
        className={
          tone === 'error'
            ? 'text-xs font-medium text-danger-fg'
            : 'text-xs font-medium text-fg-muted'
        }
      >
        {label}
      </div>
      {isRecord(value) || Array.isArray(value) ? (
        <JsonViewer
          data={value}
          className={
            tone === 'error'
              ? 'max-h-44 max-w-full bg-danger-soft break-words whitespace-pre-wrap text-danger-fg'
              : 'max-h-44 max-w-full bg-surface break-words whitespace-pre-wrap text-fg-muted'
          }
        />
      ) : (
        <pre
          className={
            tone === 'error'
              ? 'max-h-44 max-w-full overflow-auto rounded-radius-sm bg-danger-soft p-space-sm text-xs break-words whitespace-pre-wrap text-danger-fg'
              : 'max-h-44 max-w-full overflow-auto rounded-radius-sm bg-surface p-space-sm text-xs break-words whitespace-pre-wrap text-fg-muted'
          }
        >
          {content}
        </pre>
      )}
    </div>
  )
}

export function RuntimeStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const labelKey = STATUS_LABEL_KEY_MAP[status]
  const StatusIcon = STATUS_ICONS[status] || XCircle

  return (
    <Badge {...badgeLook(STATUS_BADGE_MAP[status])} className="gap-space-xs">
      <StatusIcon
        className={
          status === 'loading'
            ? 'size-3 animate-spin motion-reduce:animate-none'
            : 'size-3'
        }
      />
      {labelKey ? t(labelKey) : null}
    </Badge>
  )
}
