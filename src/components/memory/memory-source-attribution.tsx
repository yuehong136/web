import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/alert'
import type { MemorySourceAttribution as SourceAttribution } from '@/types/memory-sources'

/** Authentication, client declarations and human assessment remain separate. */
export function MemorySourceAttribution({
  value,
}: {
  value: SourceAttribution
}) {
  const { t } = useTranslation()
  const structured = value.format === 'structured'
  return (
    <div className="min-w-0 space-y-space-base">
      <Alert variant="info">{t('memory.sources.attributionBoundary')}</Alert>
      <dl className="grid min-w-0 grid-cols-1 gap-space-xs text-xs sm:grid-cols-2">
        <dt>{t('memory.sources.format')}</dt>
        <dd>
          {t(
            structured ? 'memory.sources.structured' : 'memory.sources.legacy',
          )}
        </dd>
        <dt>{t('memory.sources.submitter')}</dt>
        <dd className="min-w-0 space-y-space-xs wrap-anywhere">
          <span>
            {t(
              value.provenance.authenticated_submitter
                ? 'memory.sources.authenticatedSubmission'
                : 'memory.sources.submitterUnknown',
            )}
          </span>
          {value.provenance.submitted_by !== null && (
            <span className="block font-mono">
              {value.provenance.submitted_by}
            </span>
          )}
        </dd>
        <dt>{t('memory.sources.receivedAt')}</dt>
        <dd className="min-w-0 font-mono wrap-anywhere">
          {value.received_at ?? t('memory.sources.unknown')}
        </dd>
        <dt>{t('memory.sources.eventTime')}</dt>
        <dd className="min-w-0 space-y-space-xs wrap-anywhere">
          <span>
            {t(
              value.event_time.status === 'caller_declared'
                ? 'memory.sources.callerDeclared'
                : 'memory.sources.unknown',
            )}
          </span>
          {value.event_time.value !== null && (
            <span className="block font-mono">{value.event_time.value}</span>
          )}
        </dd>
        <dt>{t('memory.sources.referenceTime')}</dt>
        <dd className="min-w-0 font-mono wrap-anywhere">
          {value.reference_time ?? t('memory.sources.unknown')}
        </dd>
      </dl>
      <p className="text-sm text-fg-muted">
        {t('memory.sources.humanBoundary')}
      </p>
      {structured ? (
        <div className="space-y-space-sm">
          <p className="text-xs text-fg-muted">
            {t('memory.sources.rolesDeclared')}
          </p>
          <p className="text-xs">
            {t('memory.sources.segmentCount', {
              count: value.segment_count ?? 0,
            })}
          </p>
          <p className="text-sm">
            {value.declared_roles
              .map((role) => t(`memory.sources.roles.${role}`))
              .join(' · ')}
          </p>
          {value.segments_included &&
            value.segments?.map((segment, index) => (
              <section key={index} className="min-w-0 space-y-space-xs">
                <h4 className="text-xs font-medium">
                  {t('memory.sources.segment', { count: index + 1 })} ·{' '}
                  {t(`memory.sources.roles.${segment.role}`)}
                </h4>
                <pre className="max-w-full rounded-radius-md bg-sunken p-space-sm text-sm wrap-anywhere whitespace-pre-wrap">
                  {segment.content}
                </pre>
              </section>
            ))}
        </div>
      ) : (
        <p className="text-sm text-fg-muted">
          {t('memory.sources.legacyBoundary')}
        </p>
      )}
    </div>
  )
}
