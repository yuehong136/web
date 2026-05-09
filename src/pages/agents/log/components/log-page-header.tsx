import { ArrowLeft, Download, ExternalLink, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { resolveLocalizedText } from '@/lib/agent'
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
          {hasCanvas ? (
            <span className="rounded-radius-full px-space-sm border border-state-info bg-state-info-subtle py-[2px] text-xs font-medium text-state-info">
              围绕单个 Agent
            </span>
          ) : null}
        </span>
      }
      description={
        hasCanvas
          ? '查看当前 Agent 的会话、运行结果、错误与 Trace'
          : '查看任意 Agent 的会话、运行结果、错误与 Trace'
      }
      breadcrumb={
        <div className="gap-space-xs flex flex-wrap items-center text-xs text-text-tertiary">
          <span>智能体</span>
          <span>/</span>
          <span className="text-text-secondary">{agentTitle}</span>
          <span>/</span>
          <span className="text-text-secondary">运维中心</span>
          {sessionId ? (
            <>
              <span>/</span>
              <span className="text-text-caption font-mono">{sessionId}</span>
            </>
          ) : null}
        </div>
      }
      actions={
        hasCanvas ? (
          <>
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              返回 Agent Center
            </Button>
            <div className="h-5 w-px bg-border-subtle" />
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              loading={isExporting}
              onClick={onExport}
            >
              <Download className="h-4 w-4" />
              导出
            </Button>
            <Button
              size="sm"
              className="bg-text-primary text-text-inverted hover:bg-text-secondary"
              onClick={onOpenExplore}
            >
              <ExternalLink className="h-4 w-4" />
              打开 Explore
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            返回 Agent Center
          </Button>
        )
      }
    />
  )
}
