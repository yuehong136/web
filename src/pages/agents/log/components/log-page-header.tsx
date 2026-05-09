import { ArrowLeft, Download, ExternalLink, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/patterns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { isPipelineFlow, resolveLocalizedText } from '@/lib/agent'
import type { AgentFlow } from '@/types/agent'

interface LogPageHeaderProps {
  agent?: AgentFlow
  sessionId?: string
  hasCanvas: boolean
  isExporting?: boolean
  onRefresh: () => void
  onExport: () => void
  onOpenExplore: () => void
  onBack: () => void
}

export function LogPageHeader({
  agent,
  sessionId,
  hasCanvas,
  isExporting = false,
  onRefresh,
  onExport,
  onOpenExplore,
  onBack,
}: LogPageHeaderProps) {
  const agentTitle = resolveLocalizedText(agent?.title, '未选择 Agent')
  return (
    <PageHeader
      compact
      title={
        <span className="gap-space-sm inline-flex items-center">
          Agent 运维中心
          {agent ? (
            <Badge variant={isPipelineFlow(agent) ? 'blue' : 'green'}>
              {isPipelineFlow(agent) ? 'Pipeline' : 'Agent'}
            </Badge>
          ) : null}
        </span>
      }
      breadcrumb={
        <div className="gap-space-xs flex flex-wrap items-center text-xs text-text-tertiary">
          <span>智能体</span>
          <span>/</span>
          <span className="text-text-secondary">{agentTitle}</span>
          {sessionId ? (
            <span className="text-text-caption">已选择会话</span>
          ) : null}
        </div>
      }
      actions={
        hasCanvas ? (
          <>
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="size-3.5" />
              返回 Agent Center
            </Button>
            <div className="h-5 w-px bg-border-subtle" />
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7 text-text-secondary hover:text-text-primary"
              aria-label="刷新"
              onClick={onRefresh}
            >
              <RefreshCw className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="px-space-xs h-7 text-xs text-text-secondary hover:text-text-primary"
              loading={isExporting}
              onClick={onExport}
            >
              <Download className="size-3.5" />
              导出
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="px-space-xs h-7 text-xs text-text-secondary hover:text-text-primary"
              onClick={onOpenExplore}
            >
              <ExternalLink className="size-3.5" />
              打开 Explore
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="size-3.5" />
            返回 Agent Center
          </Button>
        )
      }
    />
  )
}
