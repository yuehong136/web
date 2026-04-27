import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { SplitDetailPageTemplate } from '@/components/page-templates'
import {
  AppScene,
  PageEmptyState,
  PageErrorState,
  PageHeader,
  PageLoadingState,
  SectionCard,
} from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { useFetchAgent, useFetchAgentSessions } from '@/hooks/use-agent-request'
import { buildAgentCanvasPath, resolveLocalizedText } from '@/lib/agent'
import { formatRelativeTime } from '@/lib/utils'
import { extractSessionStatus } from '../adapters/session'
import { LogDetail } from '../features/log-detail'
import { ArrowLeft } from 'lucide-react'

export default function AgentExplorePage() {
  const navigate = useNavigate()
  const { id = '' } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const agentQuery = useFetchAgent(id)
  const sessionsQuery = useFetchAgentSessions(id)
  const [selectedSessionId, setSelectedSessionId] = useState('')

  useEffect(() => {
    const sessionFromUrl = searchParams.get('session') || ''
    if (sessionFromUrl && sessionFromUrl !== selectedSessionId) {
      setSelectedSessionId(sessionFromUrl)
      return
    }

    if (!sessionFromUrl && !selectedSessionId && sessionsQuery.data.sessions.length > 0) {
      setSelectedSessionId(sessionsQuery.data.sessions[0].id)
    }
  }, [searchParams, selectedSessionId, sessionsQuery.data.sessions])

  if (sessionsQuery.isLoading && !sessionsQuery.data.sessions.length) {
    return (
      <PageLoadingState
        scene={AppScene.SPLIT_DETAIL}
        title="正在加载 Explore 会话"
        description="正在读取持久化会话列表。"
      />
    )
  }

  if (sessionsQuery.isError) {
    return (
      <PageErrorState
        scene={AppScene.SPLIT_DETAIL}
        title="Explore 会话加载失败"
        description="请检查 `/v1/canvas/:id/sessions` 接口。"
        onRetry={() => {
          void sessionsQuery.refetch()
        }}
      />
    )
  }

  return (
    <SplitDetailPageTemplate
      header={
        <PageHeader
          compact
          title={`${resolveLocalizedText(agentQuery.data?.title, 'Agent')} · Explore`}
          description="查看持久化会话的输入、输出、Trace、错误与消息记录。筛选和重放留给 T9。"
          actions={
            <Button
              variant="outline"
              onClick={() =>
                navigate(buildAgentCanvasPath(id, agentQuery.data))
              }
            >
              <ArrowLeft className="mr-space-xs h-4 w-4" />
              返回编辑器
            </Button>
          }
        />
      }
      leftWidth={340}
      leftPane={
        <div className="space-y-space-lg p-space-lg">
          <SectionCard title="会话列表" padding="default">
            {sessionsQuery.data.sessions.length ? (
              <div className="space-y-space-sm">
                {sessionsQuery.data.sessions.map((session) => {
                  const active = selectedSessionId === session.id
                  return (
                    <button
                      key={session.id}
                      type="button"
                      className={`w-full rounded-radius-lg border p-space-base text-left transition-colors ${
                        active
                          ? 'border-state-focus bg-surface-secondary'
                          : 'border-border-default hover:bg-surface-secondary'
                      }`}
                    onClick={() => {
                      setSelectedSessionId(session.id)
                      setSearchParams({ session: session.id })
                    }}
                    >
                      <div className="flex items-start justify-between gap-space-sm">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-text-primary">
                            {session.name || '未命名会话'}
                          </p>
                          <p className="mt-space-xs text-xs text-text-tertiary">
                            {session.update_time
                              ? formatRelativeTime(session.update_time)
                              : '暂无时间信息'}
                          </p>
                        </div>
                        <span className="rounded-radius-full bg-surface-secondary px-space-sm py-[2px] text-xs text-text-secondary">
                          {session.message_count || session.messages?.length || 0}
                        </span>
                      </div>
                      <p className="mt-space-xs text-xs text-text-tertiary">
                        {extractSessionStatus(session)}
                      </p>
                    </button>
                  )
                })}
              </div>
            ) : (
              <PageEmptyState
                scene={AppScene.SPLIT_DETAIL}
                compact
                title="还没有会话"
                description="运行 Agent 后，持久化会话会显示在这里。"
              />
            )}
          </SectionCard>
        </div>
      }
      rightPane={
        <div className="space-y-space-lg p-space-lg">
          {selectedSessionId ? (
            <>
              <SectionCard title="会话详情" padding="default">
                <LogDetail
                  mode="session"
                  canvasId={id}
                  sessionId={selectedSessionId}
                />
              </SectionCard>
            </>
          ) : (
            <PageEmptyState
              scene={AppScene.SPLIT_DETAIL}
              title="选择一个会话"
              description="左侧会话列表已接入，右侧详情会在后续阶段逐步演进。"
            />
          )}
        </div>
      }
    />
  )
}
