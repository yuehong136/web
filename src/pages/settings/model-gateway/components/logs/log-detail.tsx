import type { ReactNode } from 'react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import type { GatewayLog } from '@/api/model-gateway'
import {
  PREFIX,
  endpointPath,
  errorCodeOf,
  errorExplanation,
  formatCount,
  formatDuration,
  formatInstant,
  logFailed,
} from '../../utils'
import { StatusCode } from '../status-code'

/** "support-bot · qwen-plus", the heading of the detail panel. */
export const logDetailTitle = (t: TFunction, log: GatewayLog): string =>
  [log.key_name, log.model].filter(Boolean).join(' · ') ||
  t(`${PREFIX}.tabs.logs`)

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-fg-subtle">{label}</dt>
      <dd className="min-w-0 break-words text-fg">{children}</dd>
    </>
  )
}

/** One call: outcome, timing and where it went. Bodies are never stored. */
export function LogDetail({ log }: { log: GatewayLog }) {
  const { t } = useTranslation()
  const failed = logFailed(log)
  const code = errorCodeOf(log)
  const explanation = errorExplanation(t, log)
  const firstShare =
    log.first_token_ms !== null && log.duration_ms > 0
      ? Math.min(100, (log.first_token_ms / log.duration_ms) * 100)
      : 0
  const empty = t(`${PREFIX}.common.empty`)
  const tokens =
    log.total_tokens === null
      ? t(`${PREFIX}.common.unknown`)
      : t(`${PREFIX}.logs.detail.tokensValue`, {
          prompt:
            log.prompt_tokens === null ? '-' : formatCount(log.prompt_tokens),
          completion:
            log.completion_tokens === null
              ? '-'
              : formatCount(log.completion_tokens),
          total: formatCount(log.total_tokens),
        })
  const source = ['reported', 'estimated', 'unavailable'].includes(
    log.usage_source,
  )
    ? t(`${PREFIX}.logs.detail.sources.${log.usage_source}`)
    : log.usage_source

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-wrap items-center gap-space-sm">
        <StatusCode code={log.status_code} />
        {log.started_at ? (
          <time dateTime={log.started_at} className="text-sm text-fg-muted">
            {t(`${PREFIX}.logs.detail.time`, {
              value: formatInstant(log.started_at),
            })}
          </time>
        ) : null}
      </div>

      {failed && (code || explanation) ? (
        <div
          role="note"
          className="rounded-radius-md border border-danger-line bg-danger-soft p-space-md text-sm"
        >
          {code ? <div className="font-mono text-danger-fg">{code}</div> : null}
          {explanation ? (
            <p className="mt-space-2xs text-fg">{explanation}</p>
          ) : null}
        </div>
      ) : null}

      <section aria-label={t(`${PREFIX}.logs.detail.durationLabel`)}>
        <h3 className="mb-space-sm text-sm font-semibold text-fg">
          {t(`${PREFIX}.logs.detail.duration`)}
        </h3>
        <div className="flex h-2.5 overflow-hidden rounded-radius-full bg-fill-pressed">
          {firstShare > 0 ? (
            <div
              className="h-full bg-info-fg"
              style={{ width: `${firstShare}%` }}
            />
          ) : null}
          <div className="h-full flex-1 bg-accent-solid" />
        </div>
        <div className="mt-space-xs flex justify-between text-xs text-fg-muted">
          <span>
            {log.first_token_ms !== null
              ? t(`${PREFIX}.logs.detail.firstToken`, {
                  value: formatDuration(log.first_token_ms),
                })
              : t(`${PREFIX}.logs.detail.noFirstToken`)}
          </span>
          <span>
            {t(`${PREFIX}.logs.detail.total`, {
              value: formatDuration(log.duration_ms),
            })}
          </span>
        </div>
      </section>

      <dl className="grid grid-cols-[auto_1fr] gap-x-space-lg gap-y-space-xs text-sm">
        <Field label={t(`${PREFIX}.logs.detail.requestId`)}>
          <span className="font-mono text-xs">{log.id}</span>
        </Field>
        <Field label={t(`${PREFIX}.logs.detail.calledName`)}>
          <span className="font-mono">{log.model ?? empty}</span>
        </Field>
        <Field label={t(`${PREFIX}.logs.detail.upstream`)}>
          <span className="font-mono">
            {log.upstream_model_name ?? t(`${PREFIX}.logs.detail.notForwarded`)}
          </span>
        </Field>
        <Field label={t(`${PREFIX}.logs.detail.endpoint`)}>
          <span className="font-mono">
            {endpointPath(log.endpoint)}
            {log.stream ? ` · ${t(`${PREFIX}.endpoints.stream`)}` : ''}
          </span>
        </Field>
        <Field label={t(`${PREFIX}.logs.detail.tokens`)}>{tokens}</Field>
        <Field label={t(`${PREFIX}.logs.detail.usageSource`)}>{source}</Field>
        <Field label={t(`${PREFIX}.logs.detail.endUser`)}>
          <span className="font-mono">{log.end_user ?? empty}</span>
        </Field>
        <Field label={t(`${PREFIX}.logs.detail.clientIp`)}>
          <span className="font-mono">{log.client_ip ?? empty}</span>
        </Field>
      </dl>
      <p className="text-xs text-fg-subtle">
        {t(`${PREFIX}.logs.detail.noBody`)}
      </p>
    </div>
  )
}
