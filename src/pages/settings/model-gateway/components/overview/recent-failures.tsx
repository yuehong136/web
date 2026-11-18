import { useTranslation } from 'react-i18next'
import type { GatewayOverview } from '@/api/model-gateway'
import { SectionCard } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils'
import { PREFIX, errorCodeOf, errorExplanation } from '../../utils'
import { StatusCode } from '../status-code'

/** The last failed calls, each with a fixed explanation of its code. */
export function RecentFailures({
  overview,
  onViewLogs,
}: {
  overview: GatewayOverview
  onViewLogs: () => void
}) {
  const { t } = useTranslation()
  const errors = overview.recent_errors
  return (
    <SectionCard
      padding="none"
      title={t(`${PREFIX}.overview.recentErrors`)}
      actions={
        <Button variant="link" size="sm" className="px-0" onClick={onViewLogs}>
          {t(`${PREFIX}.overview.viewLogs`)}
        </Button>
      }
    >
      {errors.length === 0 ? (
        <p className="px-space-lg py-space-xl text-center text-sm text-fg-subtle">
          {t(`${PREFIX}.overview.recentEmpty`)}
        </p>
      ) : (
        <ul className="divide-y divide-line-subtle">
          {errors.map((log) => (
            <li
              key={log.id}
              className="flex flex-wrap items-center gap-x-space-md gap-y-space-xs px-space-lg py-space-sm"
            >
              <StatusCode code={log.status_code} />
              <span className="min-w-36 font-mono text-sm text-fg">
                {errorCodeOf(log) ?? t(`${PREFIX}.common.unknown`)}
              </span>
              <span className="min-w-48 flex-1 text-sm text-fg-muted">
                {[log.key_name, log.model, errorExplanation(t, log)]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
              {log.started_at ? (
                <time
                  dateTime={log.started_at}
                  className="text-xs text-fg-subtle"
                >
                  {formatRelativeTime(new Date(log.started_at).getTime())}
                </time>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
