import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Archive, RefreshCw } from 'lucide-react'
import type {
  MemoryCompactionResult,
  MemoryCompactionRetentionCapability,
} from '@/types/memory-compaction'
import { RETENTION_BLOCKERS } from '@/types/memory-compaction-retention'
import { compactionRetentionSupported } from '@/lib/memory-compaction-retention'
import { useMemoryCompactionRetention } from '@/hooks/use-memory-compaction-retention'
import { SectionCard } from '@/components/patterns/section-card'
import {
  PageLoadingState,
  PageErrorState,
} from '@/components/patterns/page-states'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert } from '@/components/ui/alert'

export function MemoryCompactionRetention({
  memoryId,
  capability,
  current,
  waitingForReceipt,
  onFence,
}: {
  memoryId: string
  capability: MemoryCompactionRetentionCapability | undefined
  current?: MemoryCompactionResult
  waitingForReceipt: boolean
  onFence: (value: MemoryCompactionResult) => void
}) {
  const { t } = useTranslation(),
    enabled = compactionRetentionSupported(capability)
  const state = useMemoryCompactionRetention(
    memoryId,
    enabled,
    current,
    onFence,
  )
  const [checkedHash, setCheckedHash] = useState<string>()
  const acknowledgmentId = useId()
  if (!enabled) return null
  const data = state.inventory.data,
    preview = state.preview.data,
    retiredAt = current?.artifact.retired_at
  const knownBlocker = (code: string) =>
    RETENTION_BLOCKERS.some((value) => value === code)
      ? code
      : 'metadata_unavailable'
  return (
    <SectionCard title={t('memory.compaction.retention.title')}>
      <div className="min-w-0 space-y-space-base">
        <p className="text-xs text-text-secondary">
          {t('memory.compaction.retention.boundary')}
        </p>
        {state.inventory.isPending ? (
          <PageLoadingState />
        ) : state.inventory.isError ? (
          <PageErrorState onRetry={() => state.inventory.refetch()} />
        ) : (
          data && (
            <>
              <dl className="grid grid-cols-2 gap-space-sm text-sm md:grid-cols-4">
                {(
                  [
                    'retained_count',
                    'available_slots',
                    'retired_count',
                    'unsettled_count',
                  ] as const
                ).map((key) => (
                  <div
                    key={key}
                    className="min-w-0 rounded-radius-md bg-background-subtle p-space-sm"
                  >
                    <dt className="text-xs text-text-secondary">
                      {t('memory.compaction.retention.' + key)}
                    </dt>
                    <dd className="mt-space-xs font-medium tabular-nums">
                      {data[key]}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="text-xs text-text-secondary">
                {t('memory.compaction.retention.quota', {
                  count: data.limit,
                  busy: data.writer_busy_count,
                })}
              </p>
              {data.available_slots === 0 && (
                <Alert variant="warning">
                  {t('memory.compaction.retention.full')}
                </Alert>
              )}
            </>
          )
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={state.inventory.isFetching}
          onClick={() => void state.inventory.refetch()}
        >
          <RefreshCw className="size-icon-sm" />
          {t('memory.compaction.retention.refreshInventory')}
        </Button>
        {current ? (
          <div className="min-w-0 space-y-space-sm border-t border-border-subtle pt-space-base">
            <p className="font-mono text-xs break-all">
              {current.artifact.artifact_id}
            </p>
            {retiredAt || state.feedback === 'retired' ? (
              <Alert variant="info">
                {t('memory.compaction.retention.retired')}
              </Alert>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={state.preview.isFetching || state.retire.isPending}
                  onClick={() => {
                    setCheckedHash(undefined)
                    void state.loadPreview()
                  }}
                >
                  <Archive className="size-icon-sm" />
                  {t('memory.compaction.retention.preview')}
                </Button>
                {state.requested &&
                  (state.preview.isFetching ? (
                    <PageLoadingState />
                  ) : state.preview.isError ? (
                    <Alert variant="warning">
                      {t('memory.compaction.retention.previewFailed')}
                    </Alert>
                  ) : (
                    preview && (
                      <div className="min-w-0 space-y-space-sm rounded-radius-md border border-border-subtle p-space-base">
                        <p className="text-sm">
                          {t('memory.compaction.retention.impact', {
                            count: preview.affected.source_count,
                            slots: preview.eligible
                              ? preview.affected.releases_slots
                              : 0,
                          })}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {t(
                            preview.affected.clears_package
                              ? 'memory.compaction.retention.clearsPackage'
                              : 'memory.compaction.retention.noPackage',
                          )}
                        </p>
                        {!!preview.affected.source_ids.length && (
                          <p className="font-mono text-xs break-all">
                            {preview.affected.source_ids.join(', ')}
                          </p>
                        )}
                        <p className="text-xs text-text-secondary">
                          {t('memory.compaction.retention.audit')}
                        </p>
                        {preview.blockers.map((code, index) => (
                          <Alert key={index} variant="warning">
                            {t(
                              'memory.compaction.retention.blockers.' +
                                knownBlocker(code),
                            )}
                          </Alert>
                        ))}
                        <label
                          htmlFor={acknowledgmentId}
                          className="flex items-start gap-space-sm text-sm"
                        >
                          <Checkbox
                            id={acknowledgmentId}
                            checked={checkedHash === preview.preview_sha256}
                            disabled={!state.canConfirm}
                            onCheckedChange={(value) =>
                              setCheckedHash(
                                value === true
                                  ? preview.preview_sha256
                                  : undefined,
                              )
                            }
                          />
                          <span>
                            {t('memory.compaction.retention.confirmLabel')}
                          </span>
                        </label>
                        <Button
                          type="button"
                          variant="destructive"
                          disabled={
                            !state.canConfirm ||
                            checkedHash !== preview.preview_sha256
                          }
                          onClick={() => state.retire.mutate(preview)}
                        >
                          {t('memory.compaction.retention.confirm')}
                        </Button>
                      </div>
                    )
                  ))}
              </>
            )}
            {state.feedback && state.feedback !== 'retired' && (
              <Alert variant="warning">
                {t('memory.compaction.retention.' + state.feedback)}
              </Alert>
            )}
            {state.retire.isPending && (
              <Alert variant="info">
                {t('memory.compaction.retention.confirming')}
              </Alert>
            )}
            {(retiredAt || waitingForReceipt || state.feedback) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={state.recovering || state.retire.isPending}
                onClick={() => void state.recover()}
              >
                {t('memory.compaction.retention.recover')}
              </Button>
            )}
          </div>
        ) : (
          <p className="text-xs text-text-secondary">
            {t('memory.compaction.retention.select')}
          </p>
        )}
      </div>
    </SectionCard>
  )
}
