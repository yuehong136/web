import { Bot, ClipboardList } from 'lucide-react'
import { AppScene, PageEmptyState } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { resolveLocalizedText } from '@/lib/agent'
import type { AgentFlow } from '@/types/agent'

interface LogEmptyStateProps {
  recentAgents: AgentFlow[]
  onSelectAgent: (canvasId: string) => void
}

export function LogEmptyState({
  recentAgents,
  onSelectAgent,
}: LogEmptyStateProps) {
  return (
    <div className="gap-space-lg p-space-lg flex h-full flex-col items-center justify-center">
      <PageEmptyState
        scene={AppScene.CONSOLE}
        compact
        title="请选择一个 Agent 查看运行记录"
        description="运维日志按 Agent 聚合。先选择 Agent，再筛选 Session、查看 Trace 或导出 CSV。"
        icon={<ClipboardList className="h-6 w-6" />}
      />
      {recentAgents.length > 0 ? (
        <div className="w-full max-w-3xl">
          <div className="mb-space-sm text-sm font-medium text-text-secondary">
            最近更新
          </div>
          <div className="gap-space-sm grid grid-cols-1 md:grid-cols-2">
            {recentAgents.map((agent) => (
              <button
                key={agent.id}
                type="button"
                className="gap-space-sm rounded-radius-lg p-space-sm shadow-elevation-low flex items-center border border-components-card-border bg-components-card-bg text-left transition-colors hover:border-state-focus hover:bg-components-card-bg-hover"
                onClick={() => onSelectAgent(agent.id)}
              >
                <div className="rounded-radius-md flex h-9 w-9 items-center justify-center bg-components-page-state-icon-bg text-components-page-state-icon">
                  <Bot className="h-4 w-4" />
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-text-primary">
                    {resolveLocalizedText(agent.title, '未命名 Agent')}
                  </span>
                  <span className="block truncate text-xs text-text-tertiary">
                    {agent.id}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <Button variant="outline" disabled>
          暂无最近 Agent
        </Button>
      )}
    </div>
  )
}
