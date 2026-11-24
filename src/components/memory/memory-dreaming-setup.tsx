import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionCard } from '@/components/patterns/section-card'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { MemoryDreamingForm } from './memory-dreaming-form'
import { MemorySourcePanel } from './memory-source-panel'
import type { MemoryCapabilities } from '@/types/memory-revisions'
import type { MemoryMaintenanceCommand } from '@/types/memory-dreaming'

export function MemoryDreamingSetup({
  memoryId,
  capabilities,
  busy,
  createPending,
  createAttempt,
  targetConflictEpoch = 0,
  onCreate,
  onRetryCreate,
  onFindCreatedJob,
}: {
  memoryId: string
  capabilities: MemoryCapabilities
  busy: boolean
  createPending: boolean
  createAttempt: MemoryMaintenanceCommand | null
  targetConflictEpoch?: number
  onCreate: (command: Omit<MemoryMaintenanceCommand, 'operation_id'>) => void
  onRetryCreate: () => void
  onFindCreatedJob: () => Promise<void>
}) {
  const { t } = useTranslation()
  const [inspectedSources, setInspectedSources] = useState<string[]>([])
  return (
    <SectionCard title={t('memory.dreaming.newJob')}>
      <MemoryDreamingForm
        memoryId={memoryId}
        targetCapability={capabilities.maintenance?.target_recommendations}
        targetConflictEpoch={targetConflictEpoch}
        disabled={busy || !!createAttempt}
        managed={capabilities.revisions?.managed === true}
        maxSources={capabilities.maintenance?.max_sources ?? 32}
        onInspectSources={setInspectedSources}
        onCreate={onCreate}
      />
      {createAttempt && !createPending && (
        <Alert variant="warning" className="mt-space-base space-y-space-sm">
          <p>{t('memory.dreaming.createUnknown')}</p>
          <p className="font-mono text-xs break-all">
            {createAttempt.operation_id}
          </p>
          <div className="flex flex-wrap gap-space-sm">
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void onFindCreatedJob()}
            >
              {t('memory.dreaming.findCreatedJob')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={onRetryCreate}
            >
              {t('memory.dreaming.retryCreate')}
            </Button>
          </div>
        </Alert>
      )}
      {!!inspectedSources.length && (
        <details open className="mt-space-base space-y-space-sm">
          <summary className="cursor-pointer text-sm font-medium">
            {t('memory.dreaming.sourceRegistration')}
          </summary>
          <p className="text-sm text-fg-muted">
            {t('memory.dreaming.registrationBoundary')}
          </p>
          {inspectedSources.map((sourceId) => (
            <MemorySourcePanel
              key={sourceId}
              memoryId={memoryId}
              sourceId={sourceId}
            />
          ))}
        </details>
      )}
    </SectionCard>
  )
}
