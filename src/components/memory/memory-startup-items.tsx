import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SectionCard } from '@/components/patterns/section-card'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type {
  MemoryStartupPackage,
  MemoryStartupSource,
} from '@/types/memory-startup'
export function MemoryStartupItems({
  value,
  onSource,
}: {
  value: MemoryStartupPackage
  onSource: (source: MemoryStartupSource) => void
}) {
  const { t } = useTranslation()
  return (
    <>
      <section aria-label={t('memory.startup.items')} className="min-w-0">
        <SectionCard title={t('memory.startup.items')}>
          <div className="min-w-0 space-y-space-base">
            {value.items.map((item) => (
              <article
                key={item.entry_id}
                className="min-w-0 space-y-space-sm rounded-radius-lg border border-line p-space-base"
              >
                <p className="font-mono text-xs break-all">
                  {item.entry_id} · {item.revision} / {item.generation}
                </p>
                <p className="text-xs font-medium">
                  {t('memory.startup.human')}
                </p>
                <p className="text-xs wrap-anywhere">
                  {t('memory.startup.entryScope')}: {JSON.stringify(item.scope)}
                </p>
                <p className="text-xs wrap-anywhere">
                  {t('memory.startup.originalAssessment')}:{' '}
                  {JSON.stringify(item.assessment)}
                </p>
                <pre className="max-w-full text-sm wrap-anywhere whitespace-pre-wrap">
                  {item.content}
                </pre>
                <p className="text-xs font-medium">
                  {t('memory.startup.applicability')}
                </p>
                <pre className="max-w-full text-sm wrap-anywhere whitespace-pre-wrap">
                  {item.verification.applicability}
                </pre>
                <p className="font-mono text-xs break-all">
                  {item.content_sha256}
                </p>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-auto min-h-9 max-w-full text-left whitespace-normal"
                >
                  <Link
                    to={`/memory/${encodeURIComponent(value.memory_id)}/verification?${new URLSearchParams({ verification_entry: item.entry_id })}`}
                  >
                    {t('memory.verification.open')}
                  </Link>
                </Button>
                <ul className="min-w-0 space-y-space-sm">
                  {item.sources.map((source) => (
                    <li
                      key={source.source_id}
                      className="min-w-0 space-y-space-xs"
                    >
                      <p className="font-mono text-xs break-all">
                        {source.source_id} · {source.source_revision} /{' '}
                        {source.source_generation}
                      </p>
                      <p className="text-xs wrap-anywhere">
                        {t('memory.startup.sourceScope')}:{' '}
                        {JSON.stringify(source.scope)}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSource(source)}
                      >
                        {t('memory.startup.readSource')}
                      </Button>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </SectionCard>
      </section>
      <section aria-label={t('memory.startup.omitted')} className="min-w-0">
        <SectionCard title={t('memory.startup.omitted')}>
          <div className="min-w-0 space-y-space-base">
            <p className="text-xs">
              {t('memory.startup.selectionCounts', {
                scanned: value.selection.scanned_count,
                limit: value.selection.inventory_limit,
                reads: value.selection.physical_read_limit,
              })}
            </p>
            {(!value.selection.selection_complete ||
              value.selection.inventory_truncated ||
              value.selection.read_limited ||
              value.omitted.details_truncated) && (
              <Alert variant="warning">{t('memory.startup.bounded')}</Alert>
            )}
            <ul className="space-y-space-xs text-sm">
              {Object.entries(value.omitted.counts).map(([reason, count]) => (
                <li key={reason}>
                  {t(`memory.startup.omissionReasons.${reason}`)}: {count}
                </li>
              ))}
            </ul>
            {value.omitted.entries.length > 0 && (
              <ul className="space-y-space-xs font-mono text-xs">
                {value.omitted.entries.map((row) => (
                  <li
                    key={`${row.entry_id}-${row.reason}`}
                    className="break-all"
                  >
                    {row.entry_id} ·{' '}
                    {t(`memory.startup.omissionReasons.${row.reason}`)}
                  </li>
                ))}
              </ul>
            )}
            <p className="font-mono text-xs break-all">
              {value.package_sha256}
            </p>
          </div>
        </SectionCard>
      </section>
    </>
  )
}
