import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ConsolePageTemplate } from '@/components/page-templates/console-page-template'
import { PageHeader } from '@/components/patterns/page-header'
import {
  PageLoadingState,
  PageErrorState,
} from '@/components/patterns/page-states'
import { Alert } from '@/components/ui/alert'
import { useMemoryCapabilities } from '@/hooks/use-memory-revisions'
import { MemoryStartupWorkspace } from '@/components/memory/memory-startup-workspace'
export function MemoryStartupPage() {
  const { id } = useParams<{ id: string }>()
  return id ? <StartupPage key={id} memoryId={id} /> : null
}
function StartupPage({ memoryId }: { memoryId: string }) {
  const { t } = useTranslation(),
    cap = useMemoryCapabilities(memoryId),
    startup = cap.data?.startup_context
  return (
    <ConsolePageTemplate
      header={
        <PageHeader
          wrapActions
          title={t('memory.startup.title')}
          description={t('memory.startup.description')}
        />
      }
    >
      <div className="min-w-0 space-y-space-lg p-space-lg">
        <Alert variant="info">{t('memory.startup.boundary')}</Alert>
        <p className="text-sm text-text-secondary">
          {t('memory.startup.stable')}
        </p>
        <p className="text-xs text-text-secondary">
          {t('memory.startup.noAutomatic')}
        </p>
        {cap.isPending ? (
          <PageLoadingState />
        ) : cap.isError ? (
          <PageErrorState onRetry={() => cap.refetch()} />
        ) : startup?.supported ? (
          <MemoryStartupWorkspace memoryId={memoryId} capability={startup} />
        ) : (
          <Alert variant="warning">{t('memory.startup.unsupported')}</Alert>
        )}
      </div>
    </ConsolePageTemplate>
  )
}
