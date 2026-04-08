import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { WorkspacePageTemplate } from '@/components/page-templates'
import {
  AppScene,
  PageEmptyState,
  PageErrorState,
  PageHeader,
  PageLoadingState,
  SectionCard,
} from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { useFetchExternalAgentInputs } from '@/hooks/use-agent-request'
import { ArrowLeft, Copy, Share2 } from 'lucide-react'

export default function AgentSharePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const agentId = searchParams.get('id') || searchParams.get('agent_id') || ''
  const betaToken =
    searchParams.get('beta') ||
    searchParams.get('token') ||
    searchParams.get('shared_id') ||
    ''
  const shareQuery = useFetchExternalAgentInputs(agentId, betaToken)

  const inputEntries = useMemo(() => {
    return Object.entries(shareQuery.data.inputs || {})
  }, [shareQuery.data.inputs])

  if (!agentId) {
    return (
      <PageEmptyState
        scene={AppScene.WORKSPACE}
        title="缺少分享资产 ID"
        description="当前链接缺少 `id` 或 `agent_id` 参数，无法定位具体的 Agent 资产。"
      />
    )
  }

  if (!betaToken) {
    return (
      <PageEmptyState
        scene={AppScene.WORKSPACE}
        title="缺少分享访问令牌"
        description="`/api/v1/agentbots/:id/inputs` 在 multirag 后端要求 `Authorization: Bearer <beta-token>`，当前链接没有提供 `beta`、`token` 或 `shared_id`。"
      />
    )
  }

  if (shareQuery.isLoading) {
    return (
      <PageLoadingState
        scene={AppScene.WORKSPACE}
        title="正在准备分享骨架"
        description="外部输入契约和分享入口正在载入。"
      />
    )
  }

  if (shareQuery.isError) {
    return (
      <PageErrorState
        scene={AppScene.WORKSPACE}
        title="分享信息加载失败"
        description="请检查 `/api/v1/agentbots/:id/inputs` 的 `Authorization: Bearer <beta-token>` 是否正确。"
      />
    )
  }

  return (
    <WorkspacePageTemplate
      header={
        <PageHeader
          title={shareQuery.data.title || 'Agent Share'}
          description="第一阶段先暴露外部输入契约和分享入口，后续再补齐无登录体验、参数表单和会话运行。"
          actions={
            <>
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-space-xs h-4 w-4" />
                返回
              </Button>
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(window.location.href)}>
                <Copy className="mr-space-xs h-4 w-4" />
                复制链接
              </Button>
            </>
          }
        />
      }
    >
      <div className="grid gap-space-lg p-space-lg lg:grid-cols-[1.4fr_0.8fr]">
        <SectionCard title="外部输入契约" padding="default">
          {inputEntries.length ? (
            <div className="space-y-space-sm">
              {inputEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-radius-lg border border-border-default bg-surface-secondary p-space-base"
                >
                  <p className="text-sm font-medium text-text-primary">{value.label || value.name || key}</p>
                  <p className="mt-space-xs text-xs text-text-secondary">
                    key: {key} · type: {value.type || 'string'} · {value.required === false || value.optional ? '可选' : '必填'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <PageEmptyState
              scene={AppScene.WORKSPACE}
              compact
              title="当前资产没有外部输入"
              description="后续阶段会在这里补上分享表单与在线调试。"
            />
          )}
        </SectionCard>

        <SectionCard title="阶段状态" padding="default">
          <p className="flex items-start gap-space-xs text-sm text-text-secondary">
            <Share2 className="mt-[2px] h-4 w-4 shrink-0 text-text-accent" />
            分享页的路由与输入契约已经固定，接下来只需要逐步把 UI 表单、运行结果和公共访问校验补进来。
          </p>
        </SectionCard>
      </div>
    </WorkspacePageTemplate>
  )
}
