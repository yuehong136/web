import { Activity } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AppScene, PageEmptyState } from '@/components/patterns'
import { getTraceEmptyStateContent } from '../hooks/use-trace-workbench'
import type { TraceEmptyStateReason } from '../types'

export function TraceEmptyState({
  reason,
}: {
  reason?: TraceEmptyStateReason
}) {
  const { t } = useTranslation()
  const content = getTraceEmptyStateContent(reason)

  return (
    <div className="flex h-full min-h-0 items-center justify-center p-space-xl">
      <PageEmptyState
        scene={AppScene.CONSOLE}
        icon={<Activity className="size-6" />}
        title={t(content.titleKey)}
        description={t(content.descriptionKey)}
      />
    </div>
  )
}
