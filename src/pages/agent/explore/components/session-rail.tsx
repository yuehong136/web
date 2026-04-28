import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
  AppScene,
  SectionCard,
} from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { QueryObserverResult } from '@tanstack/react-query'
import type { AgentSessionListResponse } from '@/types/agent'
import type {
  ExploreSession,
  ExploreSessionListParams,
} from '../types'
import { SessionCard } from './session-card'
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'

interface SessionRailProps {
  sessions: ExploreSession[]
  params: ExploreSessionListParams
  total: number
  selectedSessionId: string
  isNew: boolean
  loading: boolean
  error: boolean
  deleting?: boolean
  onChangeParams: (patch: Partial<ExploreSessionListParams>) => void
  onSelectSession: (sessionId?: string, isNew?: boolean) => void
  onCreateSession: () => void
  onDeleteSession: (session: ExploreSession) => void
  onRetry: () => Promise<QueryObserverResult<AgentSessionListResponse, Error>>
}

export function SessionRail({
  sessions,
  params,
  total,
  selectedSessionId,
  isNew,
  loading,
  error,
  deleting,
  onChangeParams,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRetry,
}: SessionRailProps) {
  const totalPages = Math.max(1, Math.ceil(total / params.page_size))

  return (
    <div className="flex h-full min-h-0 flex-col gap-space-base p-space-lg">
      <SectionCard
        title="Explore 会话"
        padding="sm"
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCreateSession}
          >
            <Plus className="size-4" />
            新建
          </Button>
        }
      >
        <div className="space-y-space-base">
          <Input
            inputSize="sm"
            value={params.keywords || ''}
            leftIcon={<Search className="size-4" />}
            placeholder="搜索会话"
            onChange={(event) =>
              onChangeParams({ keywords: event.target.value })
            }
          />

          <div className="grid grid-cols-2 gap-space-sm">
            <Input
              inputSize="sm"
              type="date"
              value={params.from_date || ''}
              onChange={(event) =>
                onChangeParams({ from_date: event.target.value })
              }
            />
            <Input
              inputSize="sm"
              type="date"
              value={params.to_date || ''}
              onChange={(event) =>
                onChangeParams({ to_date: event.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-space-sm">
            <Select
              value={params.orderby}
              onValueChange={(value) => onChangeParams({ orderby: value })}
            >
              <SelectTrigger className="h-10 rounded-radius-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="update_time">更新时间</SelectItem>
                <SelectItem value="create_time">创建时间</SelectItem>
                <SelectItem value="name">名称</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={params.desc ? 'desc' : 'asc'}
              onValueChange={(value) => onChangeParams({ desc: value === 'desc' })}
            >
              <SelectTrigger className="h-10 rounded-radius-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">倒序</SelectItem>
                <SelectItem value="asc">正序</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <div className="min-h-0 flex-1">
        {loading && sessions.length === 0 ? (
          <PageLoadingState
            scene={AppScene.SPLIT_DETAIL}
            compact
            title="正在加载会话"
            description="正在读取最近的 Explore 会话。"
          />
        ) : error ? (
          <PageErrorState
            scene={AppScene.SPLIT_DETAIL}
            compact
            title="会话加载失败"
            description="请检查 `/v1/canvas/:id/sessions` 接口。"
            onRetry={() => {
              void onRetry()
            }}
          />
        ) : sessions.length === 0 ? (
          <PageEmptyState
            scene={AppScene.SPLIT_DETAIL}
            compact
            title="还没有会话"
            description="新建会话并发送第一条消息后会显示在这里。"
          />
        ) : (
          <ScrollArea className="h-full pr-space-xs">
            <div className="space-y-space-sm">
              {sessions.map((session) => (
                <SessionCard
                  key={`${session.id}-${session.isTemporary ? 'temporary' : 'server'}`}
                  session={session}
                  selected={
                    session.isTemporary
                      ? isNew && !selectedSessionId
                      : selectedSessionId === session.id
                  }
                  disabled={deleting}
                  onSelect={() =>
                    onSelectSession(
                      session.isTemporary ? undefined : session.id,
                      Boolean(session.isTemporary),
                    )
                  }
                  onDelete={() => onDeleteSession(session)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <SectionCard padding="sm">
        <div className="flex items-center justify-between gap-space-sm">
          <p className="text-xs text-text-tertiary">
            共 {total} 条 · 第 {params.page} / {totalPages} 页
          </p>
          <div className="flex items-center gap-space-xs">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={params.page <= 1}
              onClick={() => onChangeParams({ page: params.page - 1 })}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={params.page >= totalPages}
              onClick={() => onChangeParams({ page: params.page + 1 })}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
