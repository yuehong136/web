import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ConsolePageTemplate } from '@/components/page-templates/console-page-template'
import { PageHeader } from '@/components/patterns/page-header'
import {
  PageLoadingState,
  PageErrorState,
} from '@/components/patterns/page-states'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useMemoryCapabilities } from '@/hooks/use-memory-revisions'
import { MemoryIncrementalWorkspace } from '@/components/memory/memory-incremental-workspace'

export function MemoryIncrementalPage() {
  const { id } = useParams<{ id: string }>()
  return id ? <MemoryIncremental key={id} memoryId={id} /> : null
}

function MemoryIncremental({ memoryId }: { memoryId: string }) {
  const { t } = useTranslation()
  const capability = useMemoryCapabilities(memoryId)
  const incremental = capability.data?.maintenance?.discoveries
  return (
    <ConsolePageTemplate
      header={
        <PageHeader
          wrapActions
          title={t('memory.incremental.title')}
          description={t('memory.incremental.description')}
          actions={
            <Button asChild variant="outline">
              <Link to={`/memory/${encodeURIComponent(memoryId)}/maintenance`}>
                {t('memory.incremental.manualJobs')}
              </Link>
            </Button>
          }
        />
      }
    >
      <div className="space-y-space-lg p-space-lg">
        <Alert variant="info">{t('memory.incremental.boundary')}</Alert>
        {capability.isPending ? (
          <PageLoadingState />
        ) : capability.isError ? (
          <PageErrorState onRetry={() => capability.refetch()} />
        ) : !incremental?.supported ? (
          <Alert variant="warning">{t('memory.incremental.unsupported')}</Alert>
        ) : !capability.data?.revisions?.managed ? (
          <Alert variant="warning">
            {t('memory.incremental.managedRequired')}
          </Alert>
        ) : (
          <MemoryIncrementalWorkspace
            memoryId={memoryId}
            capabilities={incremental}
            targetCapability={
              capability.data?.maintenance?.target_recommendations
            }
          />
        )}
      </div>
    </ConsolePageTemplate>
  )
}
