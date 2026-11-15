import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ConsolePageTemplate } from '@/components/page-templates/console-page-template'
import { PageHeader } from '@/components/patterns/page-header'
import { Alert } from '@/components/ui/alert'
import {
  PageLoadingState,
  PageErrorState,
} from '@/components/patterns/page-states'
import { useMemoryCapabilities } from '@/hooks/use-memory-revisions'
import { MemoryDreamingWorkspace } from '@/components/memory/memory-dreaming-workspace'

export function MemoryMaintenancePage() {
  const { id } = useParams<{ id: string }>()
  return id ? <MemoryMaintenance key={id} memoryId={id} /> : null
}

function MemoryMaintenance({ memoryId }: { memoryId: string }) {
  const { t } = useTranslation()
  const capabilities = useMemoryCapabilities(memoryId)
  return (
    <ConsolePageTemplate
      header={
        <PageHeader
          title={t('memory.dreaming.title')}
          description={t('memory.dreaming.description')}
        />
      }
    >
      <div className="space-y-space-lg p-space-lg">
        <Alert variant="info">{t('memory.dreaming.boundary')}</Alert>
        {capabilities.isPending ? (
          <PageLoadingState />
        ) : capabilities.isError ? (
          <PageErrorState onRetry={() => capabilities.refetch()} />
        ) : capabilities.data?.maintenance?.supported ? (
          <MemoryDreamingWorkspace
            memoryId={memoryId}
            capabilities={capabilities.data}
          />
        ) : (
          <Alert variant="warning">{t('memory.dreaming.unsupported')}</Alert>
        )}
      </div>
    </ConsolePageTemplate>
  )
}
