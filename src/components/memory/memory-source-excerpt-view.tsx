import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/patterns/section-card'
export function MemorySourceExcerptView({
  sourceId,
  sourceRevision,
  sourceGeneration,
  contentHash,
  excerpt,
  range,
  pending,
  errorKey,
  previous,
  next,
  onFirst,
  onPrevious,
  onNext,
}: {
  sourceId: string
  sourceRevision: string
  sourceGeneration: string
  contentHash: string
  excerpt: string | null
  range?: { start: number; end: number; total: number }
  pending: boolean
  errorKey?: string
  previous: boolean
  next: boolean
  onFirst: () => void
  onPrevious: () => void
  onNext: () => void
}) {
  const { t } = useTranslation()
  return (
    <section aria-label={t('memory.startup.sourceTitle')} className="min-w-0">
      <SectionCard title={t('memory.startup.sourceTitle')}>
        <div className="min-w-0 space-y-space-base" aria-busy={pending}>
          <Alert variant="info">{t('memory.startup.sourceBoundary')}</Alert>
          <dl className="grid min-w-0 grid-cols-1 gap-space-xs text-xs sm:grid-cols-2">
            <dt>{t('memory.startup.sourceId')}</dt>
            <dd className="min-w-0 font-mono break-all">{sourceId}</dd>
            <dt>{t('memory.startup.sourceVersions')}</dt>
            <dd className="min-w-0 font-mono break-all">
              {sourceRevision} / {sourceGeneration}
            </dd>
            <dt>{t('memory.startup.sourceHash')}</dt>
            <dd className="min-w-0 font-mono break-all">{contentHash}</dd>
          </dl>
          {errorKey && <Alert variant="warning">{t(errorKey)}</Alert>}
          {excerpt === null ? (
            <p className="text-sm text-text-secondary">
              {t('memory.startup.sourceIdle')}
            </p>
          ) : (
            <>
              <p className="text-xs">
                {range && t('memory.startup.sourcePosition', range)}
              </p>
              <pre className="max-w-full rounded-radius-md bg-background-subtle p-space-base text-sm wrap-anywhere whitespace-pre-wrap">
                {excerpt}
              </pre>
              <p className="text-xs text-text-secondary">
                {t(
                  next
                    ? 'memory.startup.sourceMore'
                    : 'memory.startup.sourceEnd',
                )}
              </p>
            </>
          )}
          <div className="flex flex-wrap gap-space-sm">
            <Button variant="outline" disabled={pending} onClick={onFirst}>
              {t('memory.startup.first')}
            </Button>
            <Button
              variant="outline"
              disabled={pending || !previous}
              onClick={onPrevious}
            >
              {t('memory.startup.previous')}
            </Button>
            <Button
              variant="outline"
              disabled={pending || !next}
              onClick={onNext}
            >
              {t('memory.startup.next')}
            </Button>
          </div>
        </div>
      </SectionCard>
    </section>
  )
}
