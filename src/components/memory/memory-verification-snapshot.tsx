import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/alert'

/** Read-only review material; provenance identifies a snapshot, never proves its truth. */
export function MemoryVerificationSnapshot({
  memoryId,
  entryId,
  revision,
  content,
  contentHash,
  sources,
  scope,
}: {
  memoryId?: string
  entryId: string
  revision: string | number
  content: string | null
  contentHash: string
  sources: {
    sourceId: string
    revision: string | number
    generation: string | number
    contentHash: string
  }[]
  scope: Record<string, unknown>
}) {
  const { t } = useTranslation()
  return (
    <section
      className="min-w-0 space-y-space-sm rounded-radius-lg border border-border-default p-space-base"
      aria-label={t('memory.verification.snapshot')}
    >
      <Alert variant="warning">
        {t('memory.verification.snapshotBoundary')}
      </Alert>
      <dl className="grid min-w-0 grid-cols-1 gap-space-xs text-xs sm:grid-cols-2">
        <dt>{t('memory.targets.entry')}</dt>
        <dd className="min-w-0 font-mono break-all">{entryId}</dd>
        <dt>{t('memory.targets.revision')}</dt>
        <dd className="min-w-0 font-mono break-all">{revision}</dd>
        <dt>{t('memory.targets.fingerprint')}</dt>
        <dd className="min-w-0 font-mono break-all">{contentHash}</dd>
      </dl>
      {content === null ? (
        <Alert variant="warning">{t('memory.verification.unavailable')}</Alert>
      ) : (
        <pre className="max-w-full rounded-radius-md bg-background-subtle p-space-sm text-sm wrap-anywhere whitespace-pre-wrap">
          {content}
        </pre>
      )}
      <details className="min-w-0 text-xs">
        <summary>{t('memory.revisions.scope')}</summary>
        <pre className="mt-space-xs wrap-anywhere whitespace-pre-wrap">
          {JSON.stringify(scope, null, 2)}
        </pre>
      </details>
      <p className="text-xs text-text-secondary">
        {t('memory.verification.sourceReading')}
      </p>
      {memoryId && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-auto min-h-9 max-w-full text-left whitespace-normal"
        >
          <Link
            to={`/memory/${encodeURIComponent(memoryId)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('memory.verification.openSources')}
          </Link>
        </Button>
      )}
      <details className="min-w-0 text-xs">
        <summary>
          {t('memory.verification.sourceVersions', { count: sources.length })}
        </summary>
        <ul className="mt-space-sm space-y-space-sm">
          {sources.map((source) => (
            <li key={source.sourceId} className="min-w-0 space-y-space-xs">
              <p className="font-mono break-all">
                {source.sourceId} [{source.revision}/{source.generation}]
              </p>
              <p className="font-mono break-all">{source.contentHash}</p>
            </li>
          ))}
        </ul>
      </details>
    </section>
  )
}
