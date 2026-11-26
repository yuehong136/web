import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import type {
  GatewayCatalogModel,
  GatewayModelHealth,
} from '@/api/model-gateway'
import { Tooltip } from '@/components/ui/tooltip'
import { cn, formatRelativeTime } from '@/lib/utils'
import { PREFIX, formatDuration, modelStateLabel } from '../../utils'

const FAILURE_CLASSES = [
  'rate_limit',
  'credential',
  'quota',
  'model_gone',
  'transient',
  'timeout',
  'unreachable',
] as const
type FailureClass = (typeof FAILURE_CLASSES)[number]

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral'

/** Why a model is not healthy, also for servers that only sent a status. */
export function failureClassOf(health: GatewayModelHealth): FailureClass {
  const known = FAILURE_CLASSES.find((item) => item === health.failure_class)
  if (known) return known
  if (health.status === 'rate_limited') return 'rate_limit'
  return health.status_code === null ? 'unreachable' : 'transient'
}

/** "Healthy · 420 ms · checked 3 minutes ago", or what is wrong and what to do. */
export function healthLabel(t: TFunction, health: GatewayModelHealth): string {
  const checked = health.checked_at
    ? formatRelativeTime(new Date(health.checked_at).getTime())
    : ''
  if (health.status === 'healthy')
    return health.source === 'traffic'
      ? t(`${PREFIX}.models.health.healthyTraffic`, { checked })
      : t(`${PREFIX}.models.health.healthy`, {
          duration: formatDuration(health.response_time_ms),
          checked,
        })
  return t(`${PREFIX}.models.health.reasons.${failureClassOf(health)}`, {
    status: health.status_code ?? '',
    checked,
  })
}

export interface ModelStatusView {
  tone: StatusTone
  /** A word or two for the table. */
  label: string
  /** The whole story, for the tooltip and the settings dialog. */
  detail: string | null
}

/** What the status column says about one model. */
export function modelStatusView(
  t: TFunction,
  model: GatewayCatalogModel,
): ModelStatusView {
  if (model.state !== 'callable')
    return {
      tone: 'neutral',
      label: t(
        `${PREFIX}.models.status.${model.state === 'closed' ? 'closed' : 'unavailable'}`,
      ),
      detail: modelStateLabel(t, model),
    }
  const health = model.health
  if (!health)
    return {
      tone: 'neutral',
      label: t(`${PREFIX}.models.status.unchecked`),
      detail: t(`${PREFIX}.models.status.uncheckedHint`),
    }
  const detail = healthLabel(t, health)
  if (health.status === 'healthy')
    return {
      tone: 'success',
      label:
        health.source === 'traffic'
          ? t(`${PREFIX}.models.status.healthy`)
          : formatDuration(health.response_time_ms),
      detail,
    }
  return {
    tone: health.status === 'rate_limited' ? 'warning' : 'danger',
    label: t(`${PREFIX}.models.status.${failureClassOf(health)}`),
    detail,
  }
}

const TONES: Record<StatusTone, { pill: string; dot: string; halo: string }> = {
  success: {
    pill: 'text-success-fg',
    dot: 'bg-success-fg',
    halo: 'bg-success-soft',
  },
  warning: {
    pill: 'bg-warning-soft text-warning-fg',
    dot: 'bg-warning-fg',
    halo: 'bg-warning-soft',
  },
  danger: {
    pill: 'bg-danger-soft text-danger-fg',
    dot: 'bg-danger-fg',
    halo: 'bg-danger-soft',
  },
  neutral: { pill: 'text-fg-subtle', dot: 'bg-fg-subtle', halo: '' },
}

/** A dot in a soft halo; the halo is what makes a column of them read as lights. */
export function StatusLight({
  tone,
  className,
}: {
  tone: StatusTone
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-3.5 shrink-0 place-items-center rounded-radius-full',
        TONES[tone].halo,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-radius-full', TONES[tone].dot)} />
    </span>
  )
}

/**
 * The state of a model in a word: its latency when healthy, the kind of
 * trouble when not. Trouble gets a filled pill so it stands out in a column of
 * quiet green; the sentence explaining it is one hover or focus away.
 */
export function ModelStatus({ model }: { model: GatewayCatalogModel }) {
  const { t } = useTranslation()
  const view = modelStatusView(t, model)
  const pill = (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-space-xs rounded-radius-full py-space-2xs text-xs font-medium whitespace-nowrap tabular-nums',
        view.tone === 'warning' || view.tone === 'danger'
          ? 'pr-space-sm pl-space-xs'
          : '',
        TONES[view.tone].pill,
      )}
    >
      <StatusLight
        tone={view.tone}
        className={
          view.tone === 'warning' || view.tone === 'danger'
            ? 'bg-transparent'
            : undefined
        }
      />
      <span className="truncate">{view.label}</span>
    </span>
  )
  if (!view.detail) return pill
  return (
    <Tooltip
      content={view.detail}
      side="top"
      align="start"
      className="max-w-80"
    >
      <button
        type="button"
        className="max-w-full cursor-default rounded-radius-full outline-hidden focus-visible:ring-2 focus-visible:ring-line-focus"
        aria-label={`${view.label}: ${view.detail}`}
      >
        {pill}
      </button>
    </Tooltip>
  )
}
