import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import { useFetchAgent, useFetchAgentSession, useFetchAgentSessions } from '@/hooks/use-agent-request'
import { buildAgentCanvasPath, resolveLocalizedText } from '@/lib/agent'
import { formatRelativeTime } from '@/lib/utils'
import { ArrowLeft, MessageSquareText } from 'lucide-react'

export default function AgentExplorePage() {
  const navigate = useNavigate()
  const { id = '' } = useParams<{ id: string }>()
  const agentQuery = useFetchAgent(id)
  const sessionsQuery = useFetchAgentSessions(id)
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const sessionQuery = useFetchAgentSession(id, selectedSessionId)

  useEffect(() => {
    if (!selectedSessionId && sessionsQuery.data.sessions.length > 0) {
      setSelectedSessionId(sessionsQuery.data.sessions[0].id)
    }
  }, [selectedSessionId, sessionsQuery.data.sessions])

  if (sessionsQuery.isLoading && !sessionsQuery.data.sessions.length) {
    return (
      <PageLoadingState
        scene={AppScene.SPLIT_DETAIL}
        title="正在加载 Explore 会话"
        description="第一阶段先把会话浏览骨架接上，聊天细节后续逐步增强。"
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
          description="这里先提供会话浏览与调试入口，后续补全完整的消息时间线、重放与筛选。"
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
                      onClick={() => setSelectedSessionId(session.id)}
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
                    </button>
                  )
                })}
              </div>
            ) : (
              <PageEmptyState
                scene={AppScene.SPLIT_DETAIL}
                compact
                title="还没有会话"
                description="运行 Agent 后，Explore 会话会逐步沉淀到这里。"
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
                {sessionQuery.isLoading ? (
                  <p className="text-sm text-text-secondary">正在加载会话详情...</p>
                ) : sessionQuery.isError ? (
                  <p className="text-sm text-state-error">当前只拿到会话列表，详情接口将在下一阶段补强。</p>
                ) : (
                  <pre className="max-h-[320px] overflow-auto rounded-radius-lg bg-surface-secondary p-space-base text-xs text-text-secondary">
                    {JSON.stringify(sessionQuery.data || {}, null, 2)}
                  </pre>
                )}
              </SectionCard>

              <SectionCard title="阶段说明" padding="default">
                <p className="flex items-start gap-space-xs text-sm text-text-secondary">
                  <MessageSquareText className="mt-[2px] h-4 w-4 shrink-0 text-text-accent" />
                  本阶段先保证会话路由、列表和详情占位稳定存在，下一阶段再替换为完整的消息气泡、筛选与重放体验。
                </p>
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
