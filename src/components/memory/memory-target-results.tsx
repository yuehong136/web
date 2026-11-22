import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/alert'
import type { MemoryTargetRecommendations } from '@/types/memory-targets'
import type { MemoryTargetCardData } from './memory-target-picker'

export function useMemoryTargetCards(
  value?: MemoryTargetRecommendations,
): MemoryTargetCardData[] {
  const { t } = useTranslation()
  return (value?.targets ?? []).map((target) => ({
    entryId: target.entry_id,
    revision: target.revision,
    content: target.content,
    fingerprint: target.content_sha256,
    truncated: false,
    reasons: (
      <ul className="space-y-space-xs">
        {target.reasons.map((reason, index) => (
          <li key={index}>
            {reason.kind === 'semantic_rank'
              ? t('memory.targets.semanticRank', { rank: reason.rank })
              : t('memory.targets.lexicalScore', { score: reason.score })}
          </li>
        ))}
      </ul>
    ),
    sources: (
      <div className="min-w-0 space-y-space-sm">
        <p className="font-mono break-all">
          {t('memory.targets.physicalMessage')}: {target.message_id}
        </p>
        <pre className="min-w-0 wrap-anywhere whitespace-pre-wrap">
          {JSON.stringify(target.scope, null, 2)}
        </pre>
        {target.source_versions.map((source) => (
          <div
            key={source.source_id}
            className="min-w-0 space-y-space-xs rounded-radius-md border border-border-default p-space-sm"
          >
            <p className="font-mono break-all">{source.source_id}</p>
            <p>
              {t('memory.dreaming.sourceVersion', {
                revision: source.source_revision,
                generation: source.source_generation,
              })}
            </p>
            <p className="font-mono break-all">{source.content_sha256}</p>
            <pre className="wrap-anywhere whitespace-pre-wrap">
              {JSON.stringify(source.scope, null, 2)}
            </pre>
            <p className="text-text-secondary">
              {t('memory.targets.projection')}
            </p>
            <p className="font-mono break-all">{source.projection_sha256}</p>
          </div>
        ))}
      </div>
    ),
  }))
}
export function MemoryTargetBudget({
  value,
}: {
  value: MemoryTargetRecommendations
}) {
  const { t } = useTranslation()
  return (
    <div className="min-w-0 space-y-space-sm text-xs">
      <dl className="grid grid-cols-2 gap-space-sm">
        <dt>{t('memory.targets.resultBudget')}</dt>
        <dd>
          {value.budget.estimated_tokens} / {value.budget.budget_tokens}
        </dd>
        <dt>{t('memory.targets.embeddingCalls')}</dt>
        <dd>{value.retrieval.embedding_calls}</dd>
        <dt>{t('memory.targets.mode')}</dt>
        <dd>{t(`memory.targets.modes.${value.retrieval.mode}`)}</dd>
        <dt>{t('memory.targets.inventoryWindow')}</dt>
        <dd>{value.retrieval.lexical_scan_limit}</dd>
        <dt>{t('memory.targets.semanticWindow')}</dt>
        <dd>{value.retrieval.semantic_limit}</dd>
      </dl>
      <p>{t('memory.targets.estimated')}</p>
      {(value.truncated || !value.retrieval.inventory_complete) && (
        <Alert variant="warning">
          {t('memory.targets.inventoryTruncated')}
        </Alert>
      )}
      <details>
        <summary className="cursor-pointer">
          {t('memory.targets.omitted')}
        </summary>
        <dl className="mt-space-sm grid grid-cols-2 gap-space-xs">
          {(Object.keys(value.omitted) as (keyof typeof value.omitted)[]).map(
            (key) => (
              <div className="contents" key={key}>
                <dt>{t(`memory.targets.omission.${key}`)}</dt>
                <dd>{value.omitted[key]}</dd>
              </div>
            ),
          )}
        </dl>
      </details>
    </div>
  )
}
