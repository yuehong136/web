import { useTranslation } from 'react-i18next'
import { CircleDot, GitBranch } from 'lucide-react'
import type { GraphStats } from '../types'

interface GraphStatsBadgeProps {
  stats: GraphStats
}

export function GraphStatsBadge({ stats }: GraphStatsBadgeProps) {
  const { t } = useTranslation()

  return (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-3 rounded-radius-lg border border-components-workspace-border bg-components-workspace-surface px-3 py-2 text-xs text-text-secondary shadow-elevation-medium backdrop-blur-sm">
      <span className="flex items-center gap-1.5">
        <CircleDot className="size-3.5 text-text-accent" />
        {t('knowledge.graph.stats.nodes', { count: stats.nodeCount })}
      </span>
      <span className="h-3 w-px bg-components-workspace-border" />
      <span className="flex items-center gap-1.5">
        <GitBranch className="size-3.5 text-text-accent" />
        {t('knowledge.graph.stats.edges', { count: stats.edgeCount })}
      </span>
    </div>
  )
}
