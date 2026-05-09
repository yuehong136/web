import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import {
  AppScene,
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns'
import { Button } from '@/components/ui/button'
import type { AgentSession } from '@/types/agent'
import type { AgentLogParamPatch, AgentLogParams } from '../types'
import { SessionListRow } from './session-list-row'

interface SessionListPaneProps {
  params: AgentLogParams
  sessions: AgentSession[]
  total: number
  filteredTotal: number
  isLoading: boolean
  isError: boolean
  isFiltered: boolean
  onChange: (patch: AgentLogParamPatch) => void
  onRetry: () => void
  onOpenExplore: () => void
}

export function SessionListPane({
  params,
  sessions,
  total,
  filteredTotal,
  isLoading,
  isError,
  isFiltered,
  onChange,
  onRetry,
  onOpenExplore,
}: SessionListPaneProps) {
  if (isLoading && sessions.length === 0) {
    return (
      <PageLoadingState
        scene={AppScene.CONSOLE}
        compact
        title="正在加载 Session"
        description="正在读取当前 Agent 的运行记录。"
      />
    )
  }

  if (isError) {
    return (
      <PageErrorState
        scene={AppScene.CONSOLE}
        compact
        title="Session 列表加载失败"
        description="请检查后端会话接口或稍后重试。"
        onRetry={onRetry}
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-components-console-surface">
      <div className="px-space-base flex h-12 shrink-0 items-center justify-between border-b border-border-subtle">
        <div className="text-sm font-semibold text-text-primary">
          Session 列表
        </div>
        <div className="gap-space-sm flex items-center text-xs text-text-tertiary">
          <span>共 {isFiltered ? filteredTotal : total} 条</span>
          <Button variant="ghost" size="sm" className="px-space-xs h-7 text-xs">
            最近更新
            <ChevronDown className="size-3.5" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto overscroll-contain">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <SessionListRow
              key={session.id}
              session={session}
              active={session.id === params.sessionId}
              onSelect={(sessionId) => onChange({ sessionId })}
            />
          ))
        ) : (
          <PageEmptyState
            scene={AppScene.CONSOLE}
            compact
            title="暂无运行记录"
            description="当前筛选条件下没有可查看的 Session。"
            action={
              <Button variant="outline" size="sm" onClick={onOpenExplore}>
                <ExternalLink className="size-3.5" />
                打开 Explore
              </Button>
            }
          />
        )}
      </div>
      <CompactPagination
        total={isFiltered ? filteredTotal : total}
        serverTotal={total}
        page={params.page}
        pageSize={params.pageSize}
        isFiltered={isFiltered}
        onPageChange={(page) => onChange({ page })}
      />
    </div>
  )
}

function CompactPagination({
  total,
  serverTotal,
  page,
  pageSize,
  isFiltered,
  onPageChange,
}: {
  total: number
  serverTotal: number
  page: number
  pageSize: number
  isFiltered: boolean
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="gap-space-sm px-space-base py-space-base flex shrink-0 flex-col border-t border-border-subtle text-xs text-text-tertiary">
      <span className="leading-none">
        第 {page} / {totalPages} 页
        {isFiltered ? ` · 服务器共 ${serverTotal}` : ''}
      </span>
      <div className="gap-space-xs flex items-center">
        <Button
          variant="outline"
          size="sm"
          className="min-w-0 flex-1"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-3.5" />
          上一页
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="min-w-0 flex-1"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          下一页
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
