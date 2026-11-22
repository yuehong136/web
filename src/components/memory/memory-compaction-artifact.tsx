import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/patterns/section-card'
import {
  compactionBodyReady,
  compactionReaderSource,
} from '@/lib/memory-compaction'
import type {
  MemoryCompactionResult,
  MemoryCompactionSource,
} from '@/types/memory-compaction'
import { MemorySourceReader } from './memory-source-reader'

export function MemoryCompactionArtifactView({
  value,
  onInvalid,
  onCopyReference,
  referencePending,
  referenceFeedback,
}: {
  value: MemoryCompactionResult
  onInvalid: () => void
  onCopyReference: () => void
  referencePending: boolean
  referenceFeedback?: string
}) {
  const { t } = useTranslation()
  const [source, setSource] = useState<MemoryCompactionSource | null>(null)
  const artifact = value.artifact
  if (!artifact) return null
  const body = compactionBodyReady(value) ? artifact.package : null
  const usage = artifact.usage
  const difference =
    typeof usage.estimated_before_tokens === 'number' &&
    typeof usage.estimated_after_tokens === 'number'
      ? usage.estimated_before_tokens - usage.estimated_after_tokens
      : null
  return (
    <SectionCard title={t('memory.compaction.artifact')}>
      <div className="min-w-0 space-y-space-base">
        <Alert variant="info">{t('memory.compaction.snapshot')}</Alert>
        <dl className="min-w-0 space-y-space-xs text-xs">
          <dt>{t('memory.compaction.artifactId')}</dt>
          <dd className="font-mono break-all">{artifact.artifact_id}</dd>
          <dt>{t('memory.compaction.manifest')}</dt>
          <dd className="font-mono break-all">
            {artifact.input_manifest_sha256}
          </dd>
          <dt>{t('memory.compaction.model')}</dt>
          <dd className="break-all">
            {artifact.model_binding.model_reference}
          </dd>
          <dt>{t('memory.compaction.modelConfig')}</dt>
          <dd className="font-mono break-all">
            {artifact.model_binding.config_reference}
          </dd>
          <dt>{t('memory.compaction.before')}</dt>
          <dd>
            {usage.estimated_before_tokens ??
              t('memory.compaction.notMeasured')}
          </dd>
          <dt>{t('memory.compaction.after')}</dt>
          <dd>
            {usage.estimated_after_tokens ?? t('memory.compaction.notMeasured')}{' '}
            / {usage.budget_tokens}
          </dd>
          <dt>{t('memory.compaction.savings')}</dt>
          <dd>{difference ?? t('memory.compaction.notMeasured')}</dd>
        </dl>
        <p className="text-xs text-text-secondary">
          {t('memory.compaction.estimateBoundary')}
        </p>
        <p className="text-xs text-text-secondary">
          {t('memory.compaction.billingUnknown')}
        </p>
        <p className="text-xs text-text-secondary">
          {t('memory.compaction.referenceBoundary')}
        </p>
        {referenceFeedback && (
          <Alert variant="info">{t(referenceFeedback)}</Alert>
        )}
        {(body || referencePending) && (
          <Button
            type="button"
            variant="outline"
            disabled={referencePending}
            onClick={onCopyReference}
          >
            {t(
              referencePending
                ? 'memory.compaction.referenceReading'
                : 'memory.compaction.copyReference',
            )}
          </Button>
        )}
        {body && (
          <>
            <h3 className="text-sm font-semibold">
              {t('memory.compaction.summary')}
            </h3>
            <pre className="max-h-96 overflow-auto rounded-radius-md bg-background-subtle p-space-base text-sm break-words whitespace-pre-wrap">
              {body.summary ?? t('memory.compaction.noSummary')}
            </pre>
            <h3 className="text-sm font-semibold">
              {t('memory.compaction.retained')}
            </h3>
            {body.retained.map((block) => (
              <details
                key={block.source_id}
                className="min-w-0 rounded-radius-md border border-border-subtle p-space-sm"
              >
                <summary className="cursor-pointer text-xs break-all">
                  {block.source_id} · {block.format} · {block.role_status}
                </summary>
                <pre className="mt-space-sm max-h-96 overflow-auto text-sm break-words whitespace-pre-wrap">
                  {block.content}
                </pre>
              </details>
            ))}
            <h3 className="text-sm font-semibold">
              {t('memory.compaction.lineage')}
            </h3>
            <p className="text-xs text-text-secondary">
              {t('memory.compaction.sourceBoundary')}
            </p>
            <ol className="min-w-0 space-y-space-sm">
              {body.lineage.map((item, index) => (
                <li
                  key={item.source_id}
                  className="min-w-0 space-y-space-xs rounded-radius-md border border-border-subtle p-space-sm text-xs"
                >
                  <p className="font-mono break-all">
                    {index + 1}. {item.source_id} · {item.source_revision} /{' '}
                    {item.source_generation}
                  </p>
                  <p className="font-mono break-all">{item.content_sha256}</p>
                  <dl className="min-w-0 space-y-space-xs">
                    {(['user_id', 'agent_id', 'session_id'] as const).map(
                      (field) => (
                        <div key={field}>
                          <dt>{field}</dt>
                          <dd className="break-all">
                            {item.scope[field] === ''
                              ? t('memory.compaction.exactEmpty')
                              : JSON.stringify(item.scope[field])}
                          </dd>
                        </div>
                      ),
                    )}
                  </dl>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSource(item)}
                  >
                    {t('memory.compaction.readSource')}
                  </Button>
                </li>
              ))}
            </ol>
            {source && (
              <MemorySourceReader
                key={JSON.stringify(source)}
                memoryId={artifact.memory_id}
                source={compactionReaderSource(source)}
                onInvalid={onInvalid}
              />
            )}
          </>
        )}
      </div>
    </SectionCard>
  )
}
