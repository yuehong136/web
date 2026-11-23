import { MemoryFragmentProvenance } from './memory-fragment-provenance'
import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/alert'
import type {
  MemoryDiscoveryCounts,
  MemoryDiscoveryProfile,
  MemoryDiscoveryPreviewBatch,
} from '@/types/memory-incremental'

export function MemoryDiscoveryCountsView({
  value,
  snapshot = false,
}: {
  value: MemoryDiscoveryCounts
  snapshot?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-space-sm">
      <p className="text-sm font-medium">
        {t(
          snapshot
            ? 'memory.incremental.snapshotCounts'
            : 'memory.incremental.currentCounts',
        )}
      </p>
      <dl className="grid grid-cols-2 gap-space-base text-sm md:grid-cols-4">
        {(
          [
            'active',
            'covered',
            'inflight',
            'blocked',
            'eligible',
            'selected_primary',
            'context',
          ] as const
        ).map((key) => (
          <div key={key}>
            <dt className="text-xs text-text-secondary">
              {t(`memory.incremental.counts.${key}`)}
            </dt>
            <dd className="font-medium">{value[key]}</dd>
          </div>
        ))}
      </dl>
      {value.selected_fragments !== undefined && (
        <p className="text-sm">
          <span className="text-text-secondary">
            {t('memory.segments.selectedFragments')}:{' '}
          </span>
          {value.selected_fragments}
        </p>
      )}
    </div>
  )
}

export function MemoryDiscoveryProfileView({
  profile,
  fingerprint,
}: {
  profile: MemoryDiscoveryProfile
  fingerprint: string
}) {
  const { t } = useTranslation()
  return (
    <details className="rounded-radius-lg border border-border-default p-space-base text-xs">
      <summary className="cursor-pointer font-medium">
        {t('memory.incremental.profile')}
      </summary>
      <p className="my-space-sm text-text-secondary">
        {t('memory.incremental.profileHint')}
      </p>
      <dl className="grid gap-space-sm md:grid-cols-2">
        <dt>{t('memory.incremental.profileIdentity')}</dt>
        <dd className="font-mono break-all">{fingerprint}</dd>
        <dt>{t('memory.segments.mode')}</dt>
        <dd>
          {t(
            profile.segmentation
              ? 'memory.segments.segmentedMode'
              : 'memory.segments.wholeMode',
          )}
        </dd>
        {profile.segmentation && (
          <>
            <dt>{t('memory.segments.fragmentBudget')}</dt>
            <dd>{profile.segmentation.fragment_token_limit}</dd>
            <dt>{t('memory.segments.maxParts')}</dt>
            <dd>{profile.segmentation.max_parts_per_source}</dd>
            <dt>{t('memory.segments.splitter')}</dt>
            <dd>{profile.segmentation.splitter_version}</dd>
          </>
        )}
        <dt>{t('memory.dreaming.policy')}</dt>
        <dd>{t(`memory.dreaming.policies.${profile.policy}`)}</dd>
        <dt>{t('memory.incremental.model')}</dt>
        <dd className="break-all">{profile.model_reference}</dd>
        <dt>{t('memory.incremental.strategy')}</dt>
        <dd className="font-mono break-all">{profile.strategy_sha256}</dd>
        <dt>{t('memory.incremental.config')}</dt>
        <dd className="font-mono break-all">{profile.config_reference}</dd>
        {(['user_id', 'agent_id', 'session_id'] as const).map((key) => (
          <div key={key} className="contents">
            <dt>
              {t(
                `memory.incremental.scopeFields.${key === 'user_id' ? 'user' : key === 'agent_id' ? 'agent' : 'session'}`,
              )}
            </dt>
            <dd className="font-mono break-all whitespace-pre-wrap">
              {profile.scope[key] === null
                ? t('memory.incremental.allValues')
                : profile.scope[key] === ''
                  ? t('memory.incremental.emptyExact')
                  : profile.scope[key]}
            </dd>
          </div>
        ))}
        <dt>{t('memory.incremental.inputBudget')}</dt>
        <dd>{profile.input_budget_tokens}</dd>
        <dt>{t('memory.incremental.outputBudget')}</dt>
        <dd>{profile.output_budget_tokens}</dd>
        <dt>{t('memory.incremental.contextEntries')}</dt>
        <dd className="font-mono break-all">
          {profile.entries
            .map((entry) => `${entry.entry_id} (${entry.revision})`)
            .join(', ') || t('memory.incremental.none')}
        </dd>
      </dl>
    </details>
  )
}

export function MemoryDiscoverySourcePlan({
  batches,
}: {
  batches: MemoryDiscoveryPreviewBatch[]
}) {
  const { t } = useTranslation()
  return (
    <details className="text-xs">
      <summary className="cursor-pointer font-medium">
        {t('memory.incremental.sourcePlan', { count: batches.length })}
      </summary>
      <ol className="mt-space-sm space-y-space-sm">
        {batches.map((batch) => (
          <li
            key={batch.ordinal}
            className="space-y-space-xs rounded-radius-md border border-border-default p-space-sm"
          >
            <p className="font-medium">
              {t('memory.incremental.childOrdinal', { ordinal: batch.ordinal })}
            </p>
            {(['primary_sources', 'context_sources'] as const).map((kind) => (
              <div key={kind}>
                <span>{t(`memory.incremental.${kind}`)}: </span>
                {batch[kind].length ? (
                  <ul className="space-y-space-sm">
                    {batch[kind].map((source) => (
                      <li
                        key={source.fragment?.fragment_id ?? source.source_id}
                        className="space-y-space-xs"
                      >
                        <p className="font-mono break-all">
                          {source.source_id} [{source.source_revision}/
                          {source.source_generation}]
                        </p>
                        <MemoryFragmentProvenance fragment={source.fragment} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span>{t('memory.incremental.none')}</span>
                )}
              </div>
            ))}
          </li>
        ))}
      </ol>
    </details>
  )
}

export function MemoryIncrementalBoundaries({
  hasMore,
  tokenFit = 'not_checked',
  targetBound = false,
}: {
  hasMore: boolean
  tokenFit?: 'not_checked' | 'checked_at_preview'
  targetBound?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-space-sm">
      <Alert variant="warning">
        {t(
          tokenFit === 'checked_at_preview'
            ? 'memory.segments.previewBoundary'
            : targetBound
              ? 'memory.targets.boundPreview'
              : 'memory.incremental.tokenFit',
        )}
      </Alert>
      {hasMore && (
        <Alert variant="info">{t('memory.incremental.hasMore')}</Alert>
      )}
    </div>
  )
}

export function MemoryIncrementalSaveBoundary({
  tokenFit,
  targetBound = false,
}: {
  tokenFit: 'not_checked' | 'checked_at_preview'
  targetBound?: boolean
}) {
  const { t } = useTranslation()
  return (
    <p className="text-xs text-text-secondary">
      {t(
        tokenFit === 'checked_at_preview'
          ? 'memory.segments.createBoundary'
          : targetBound
            ? 'memory.targets.boundSave'
            : 'memory.incremental.createBoundary',
      )}
    </p>
  )
}
