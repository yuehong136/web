import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ConsolePageTemplate } from '@/components/page-templates/console-page-template'
import { PageHeader } from '@/components/patterns/page-header'
import { Alert } from '@/components/ui/alert'
import { MemoryCompactionWorkspace } from '@/components/memory/memory-compaction-workspace'

export function MemoryCompactionPage() {
  const { id } = useParams<{ id: string }>(),
    { t } = useTranslation()
  return (
    <ConsolePageTemplate
      header={
        <PageHeader
          wrapActions
          title={t('memory.compaction.title')}
          description={t('memory.compaction.description')}
        />
      }
    >
      <div className="min-w-0 space-y-space-lg p-space-lg">
        <Alert variant="warning">{t('memory.compaction.boundary')}</Alert>
        <p className="text-sm text-text-secondary">
          {t('memory.compaction.noAutomatic')}
        </p>
        {id && <MemoryCompactionWorkspace key={id} memoryId={id} />}
      </div>
    </ConsolePageTemplate>
  )
}
