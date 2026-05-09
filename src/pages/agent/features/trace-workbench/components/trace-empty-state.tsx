import { Activity } from 'lucide-react'
import { AppScene, PageEmptyState } from '@/components/patterns'
import { getTraceEmptyStateContent } from '../hooks/use-trace-workbench'
import type { TraceEmptyStateReason } from '../types'

export function TraceEmptyState({
  reason,
}: {
  reason?: TraceEmptyStateReason
}) {
  const content = getTraceEmptyStateContent(reason)

  return (
    <div className="p-space-xl flex h-full min-h-0 items-center justify-center">
      <PageEmptyState
        scene={AppScene.CONSOLE}
        icon={<Activity className="size-6" />}
        title={content.title}
        description={content.description}
      />
    </div>
  )
}
