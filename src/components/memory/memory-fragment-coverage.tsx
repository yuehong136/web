import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/alert'
import { memorySegmentReasonKey } from '@/lib/memory-segments'
import type { MemoryDiscoveryPreview } from '@/types/memory-incremental'

export function MemoryFragmentCoverage({
  value,
  live = false,
}: {
  value: MemoryDiscoveryPreview
  live?: boolean
}) {
  const { t } = useTranslation()
  if (!value.source_coverage) return null
  const coverage = value.source_coverage
  return (
    <section
      className="space-y-space-sm"
      aria-label={t('memory.segments.sourceCoverage')}
      aria-live="polite"
    >
      <h3 className="text-sm font-medium">
        {t('memory.segments.sourceCoverage')}
      </h3>
      <p className="text-xs text-fg-muted">
        {t(
          live
            ? 'memory.segments.liveCoverageHint'
            : 'memory.segments.previewCoverageHint',
        )}
      </p>
      <dl className="grid grid-cols-2 gap-space-base text-sm md:grid-cols-4">
        {(
          [
            ['sourcesSelected', coverage.selected],
            ['sourcesCovered', coverage.covered],
            ['sourcesPartial', coverage.partial],
            ['sourcesBlocked', coverage.blocked],
            ['totalParts', coverage.total_parts],
            ['analyzedParts', coverage.analyzed_parts],
          ] as const
        ).map(([label, count]) => (
          <div key={label}>
            <dt className="text-xs text-fg-muted">
              {t(`memory.segments.${label}`)}
            </dt>
            <dd className="font-medium">{count}</dd>
          </div>
        ))}
      </dl>
      {!!coverage.partial && (
        <Alert variant="info">{t('memory.segments.partialHint')}</Alert>
      )}
      <p className="text-xs text-fg-muted">
        {t('memory.segments.reviewBoundary')}
      </p>
      {!!value.blocked_sources?.length && (
        <details open className="text-xs">
          <summary className="cursor-pointer font-medium">
            {t('memory.segments.blockedSources')}
          </summary>
          <ul className="mt-space-sm space-y-space-sm">
            {value.blocked_sources.map((source) => (
              <li
                key={`${source.source_id}:${source.source_revision}:${source.source_generation}`}
                className="space-y-space-xs rounded-radius-md border border-line p-space-sm"
              >
                <p className="font-mono break-all">
                  {source.source_id} [{source.source_revision}/
                  {source.source_generation}]
                </p>
                <p>
                  {t('memory.segments.reason')}:{' '}
                  {t(memorySegmentReasonKey(source.error_code))}
                </p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
