import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/alert'
import type { MemoryCapabilities } from '@/types/memory-revisions'

export function MemoryManagedNotice({
  capabilities,
  activation = false,
}: {
  capabilities?: MemoryCapabilities
  activation?: boolean
}) {
  const { t } = useTranslation()
  const writes = capabilities?.writes
  if (!writes)
    return (
      <Alert variant="warning">
        {t(
          activation
            ? 'memory.revisions.activationImpact'
            : 'memory.revisions.managedNotice',
        )}
      </Alert>
    )
  return (
    <Alert variant="info">
      <div className="space-y-space-xs">
        <p>
          {t(
            activation ? 'memory.writers.activation' : 'memory.writers.managed',
          )}
        </p>
        <ul className="list-inside list-disc text-xs">
          {(['append', 'automatic_extraction', 'fifo'] as const).map(
            (feature) => (
              <li key={feature}>
                {t(`memory.writers.${feature}`)}:{' '}
                {t(
                  writes.supported && writes[feature]
                    ? 'memory.writers.supported'
                    : 'memory.writers.unavailable',
                )}
              </li>
            ),
          )}
        </ul>
        <p className="text-xs">{t('memory.writers.operationBoundary')}</p>
        <p className="text-xs">{t('memory.writers.legacyDrain')}</p>
      </div>
    </Alert>
  )
}
