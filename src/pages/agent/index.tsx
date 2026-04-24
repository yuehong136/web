import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ReactFlowProvider } from '@xyflow/react'
import { StudioPageTemplate } from '@/components/page-templates'
import {
  AppScene,
  PageErrorState,
  PageHeader,
  PageLoadingState,
  PageToolbar,
} from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSetModalState } from '@/hooks/common-hooks'
import {
  buildAgentCanvasPath,
  formatVersionLabel,
  isPipelineFlow,
  resolveLocalizedText,
} from '@/lib/agent'
import {
  useFetchVersionList,
} from '@/hooks/use-agent-request'
import { toast } from '@/lib/toast'
import { useFetchDataOnMount } from './hooks/use-fetch-data'
import { useAgentDeliveryToken } from './hooks/use-agent-delivery-token'
import { useWatchAgentChange } from './hooks/use-watch-agent-change'
import { useBuildWebhookUrl } from './hooks/use-build-webhook-url'
import { useSaveGraph } from './hooks/use-save-graph'
import { buildAgentShareUrl } from './share/access'
import AgentCanvas from './canvas'
import { EditorRuntimeRail } from './components/editor-runtime-rail'
import { PlaceholderDialog } from './components/placeholder-dialog'
import {
  AgentRuntimeStatus,
  RuntimeWorkbenchView,
  type RuntimeWorkbenchSummary,
} from './features/runtime-workbench'
import {
  PipelineWorkbenchView,
  type PipelineWorkbenchSummary,
} from './features/pipeline-workbench'
import { SettingDialog } from './setting-dialog'
import { VersionDialog } from './version-dialog'
import { WebhookSheet } from './webhook-sheet'
import {
  ArrowLeft,
  Compass,
  History,
  Link2,
  Play,
  Save,
  Share2,
  Sparkles,
  Settings2,
} from 'lucide-react'

export default function AgentEditorPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id = '' } = useParams<{ id: string }>()
  const { flowDetail, loading } = useFetchDataOnMount()
  const { saveGraph, loading: saving } = useSaveGraph(id)
  const editorMode: 'agent' | 'pipeline' = isPipelineFlow(flowDetail)
    ? 'pipeline'
    : 'agent'
  const deliveryToken = useAgentDeliveryToken(
    Boolean(flowDetail?.id) && editorMode === 'agent',
  )
  const autosaveLabel = useWatchAgentChange()
  const versionQuery = useFetchVersionList(id)
  const webhookUrl = useBuildWebhookUrl()

  const [title, setTitle] = useState('')
  const [titleDirty, setTitleDirty] = useState(false)
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [webhookOpen, setWebhookOpen] = useState(false)
  const [roadmapOpen, setRoadmapOpen] = useState(false)
  const [publishedShareUrl, setPublishedShareUrl] = useState('')
  const defaultRuntimeView =
    editorMode === 'pipeline'
      ? PipelineWorkbenchView.RUN
      : RuntimeWorkbenchView.RUN
  const [runtimeWorkbenchOpen, setRuntimeWorkbenchOpen] = useState(false)
  const [runtimeWorkbenchView, setRuntimeWorkbenchView] = useState<string>(
    defaultRuntimeView,
  )
  const buildIdleSummary = useCallback((): RuntimeWorkbenchSummary | PipelineWorkbenchSummary => {
    if (editorMode === 'pipeline') {
      return {
        status: AgentRuntimeStatus.IDLE,
        currentView: PipelineWorkbenchView.RUN,
        messageCount: 0,
        hasLogs: false,
        outputAvailable: false,
      }
    }
    return {
      status: AgentRuntimeStatus.IDLE,
      currentView: RuntimeWorkbenchView.RUN,
      messageCount: 0,
      hasLogs: false,
    }
  }, [editorMode])
  const [runtimeSummary, setRuntimeSummary] = useState<
    RuntimeWorkbenchSummary | PipelineWorkbenchSummary
  >(buildIdleSummary)
  const settingState = useSetModalState(false)

  useEffect(() => {
    setRuntimeWorkbenchOpen(false)
    setRuntimeWorkbenchView(defaultRuntimeView)
    setRuntimeSummary(buildIdleSummary())
  }, [buildIdleSummary, defaultRuntimeView, editorMode])

  useEffect(() => {
    if (!titleDirty && flowDetail?.title) {
      setTitle(resolveLocalizedText(flowDetail.title, '未命名资产'))
    }
  }, [flowDetail?.title, titleDirty])

  useEffect(() => {
    if (!flowDetail?.id) {
      return
    }

    const expectedPath = buildAgentCanvasPath(flowDetail.id, flowDetail)
    const currentPath = `${location.pathname}${location.search}`

    if (currentPath !== expectedPath) {
      navigate(expectedPath, { replace: true })
    }
  }, [flowDetail, location.pathname, location.search, navigate])

  const versions = useMemo(() => {
    return versionQuery.data.map((version, index) => ({
      id: version.id || version.version_id || `version-${index}`,
      name: formatVersionLabel(version, index),
      createdAt: version.create_date || version.update_date || '',
      description: version.description,
      release: Boolean(version.release),
    }))
  }, [versionQuery.data])

  const handleSave = async () => {
    if (!id) {
      return
    }

    const nextTitle = title.trim() || resolveLocalizedText(flowDetail?.title, '未命名资产')
    await saveGraph(nextTitle)
    setTitleDirty(false)
  }

  const handlePublish = async (note: string) => {
    if (!id) {
      return
    }

    try {
      const nextTitle = title.trim() || resolveLocalizedText(flowDetail?.title, '未命名资产')
      const saved = await saveGraph(nextTitle, undefined, { release: true })
      if (!saved) {
        toast.error('发布失败：当前画布保存未完成')
        return
      }

      const betaToken = await deliveryToken.ensureToken()
      const shareUrl = buildAgentShareUrl({
        agentId: id,
        betaToken,
        release: true,
      })

      setTitleDirty(false)
      setPublishedShareUrl(shareUrl)
      toast.success(note ? `发布成功：${note}` : '发布成功')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '发布失败')
    }
  }

  const handleOpenShare = useCallback(async () => {
    try {
      const betaToken = await deliveryToken.ensureToken()
      navigate(
        buildAgentShareUrl({
          agentId: id,
          betaToken,
          release: Boolean(flowDetail?.release),
        }).replace(window.location.origin, ''),
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '无法生成 Share 链接')
    }
  }, [deliveryToken, flowDetail?.release, id, navigate])

  const openRuntimeWorkbench = useCallback(
    (view?: string) => {
      const nextView =
        view ||
        (editorMode === 'pipeline' &&
        (runtimeSummary.status === AgentRuntimeStatus.RUNNING ||
          runtimeSummary.status === AgentRuntimeStatus.PREPARING) &&
        runtimeSummary.hasLogs
          ? PipelineWorkbenchView.LOG
          : defaultRuntimeView)

      setRuntimeWorkbenchView(nextView)
      setRuntimeWorkbenchOpen(true)
    },
    [defaultRuntimeView, editorMode, runtimeSummary.hasLogs, runtimeSummary.status],
  )

  if (loading) {
    return (
      <PageLoadingState
        scene={AppScene.STUDIO}
        title="正在初始化 Agent 编辑器"
        description="新的 Studio 骨架正在挂载现有 Canvas 内核。"
      />
    )
  }

  if (!flowDetail?.id) {
    return (
      <PageErrorState
        scene={AppScene.STUDIO}
        title="未找到 Agent 资产"
        description="请从 Agent Center 重新打开，或检查 `/v1/canvas/get/:id` 接口。"
        onRetry={() => navigate('/agents')}
        retryLabel="返回 Agent Center"
      />
    )
  }

  return (
    <>
      <StudioPageTemplate
        toolbar={
          <>
            <PageHeader
              compact
              title={
                <div className="flex max-w-xl items-center gap-space-sm">
                  <Input
                    value={title}
                    onChange={(event) => {
                      setTitleDirty(true)
                      setTitle(event.target.value)
                    }}
                    className="h-11 text-base font-semibold"
                    placeholder="输入 Agent 名称"
                  />
                </div>
              }
              description={`ID: ${flowDetail.id} · 自动保存 ${autosaveLabel || '待首次保存'}`}
              actions={
                <>
                  <Button variant="outline" onClick={() => navigate('/agents')}>
                    <ArrowLeft className="mr-space-xs h-4 w-4" />
                    返回
                  </Button>
                  {editorMode === 'agent' ? (
                    <>
                      <Button variant="outline" onClick={() => navigate(`/agent/${id}/explore`)}>
                        <Compass className="mr-space-xs h-4 w-4" />
                        Explore
                      </Button>
                      <Button variant="outline" onClick={() => setVersionsOpen(true)}>
                        <History className="mr-space-xs h-4 w-4" />
                        发布
                      </Button>
                      <Button variant="outline" onClick={() => setWebhookOpen(true)}>
                        <Link2 className="mr-space-xs h-4 w-4" />
                        Webhook
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => void handleOpenShare()}
                      >
                        <Share2 className="mr-space-xs h-4 w-4" />
                        Share
                      </Button>
                    </>
                  ) : null}
                  <Button variant="outline" onClick={settingState.showModal}>
                    <Settings2 className="mr-space-xs h-4 w-4" />
                    设置
                  </Button>
                  <Button variant="secondary" onClick={handleSave} disabled={saving}>
                    <Save className="mr-space-xs h-4 w-4" />
                    {saving ? '保存中...' : '保存'}
                  </Button>
                  <Button onClick={() => openRuntimeWorkbench()}>
                    <Play className="mr-space-xs h-4 w-4" />
                    运行
                  </Button>
                </>
              }
            />
            <PageToolbar
              left={
                <div className="flex items-center gap-space-sm text-sm text-text-secondary">
                  <Sparkles className="h-4 w-4 text-text-accent" />
                  {editorMode === 'pipeline'
                    ? 'T6 已正式化 Pipeline 的运行、日志时间线与输出工作台。'
                    : 'T4 已正式化普通 Agent 的运行、Conversation 与单步调试工作台。'}
                </div>
              }
              right={
                <Button variant="outline" onClick={() => setRoadmapOpen(true)}>
                  查看阶段说明
                </Button>
              }
            />
          </>
        }
        sidePanel={
          <EditorRuntimeRail
            flow={flowDetail}
            editorMode={editorMode}
            autosaveLabel={autosaveLabel}
            runtimeSummary={runtimeSummary}
            onOpenRuntime={openRuntimeWorkbench}
            onOpenExplore={() => navigate(`/agent/${id}/explore`)}
            onOpenVersions={() => setVersionsOpen(true)}
            onOpenWebhook={() => setWebhookOpen(true)}
            onOpenSettings={settingState.showModal}
            onOpenShare={() => void handleOpenShare()}
            onOpenRoadmap={() => setRoadmapOpen(true)}
          />
        }
      >
        <ReactFlowProvider>
          <AgentCanvas
            editorMode={editorMode}
            runtimeWorkbenchOpen={runtimeWorkbenchOpen}
            runtimeWorkbenchView={runtimeWorkbenchView}
            onRuntimeWorkbenchOpenChange={setRuntimeWorkbenchOpen}
            onRuntimeWorkbenchViewChange={setRuntimeWorkbenchView}
            onRuntimeSummaryChange={setRuntimeSummary}
          />
        </ReactFlowProvider>
      </StudioPageTemplate>

      {versionsOpen ? (
        <VersionDialog
          hideModal={() => setVersionsOpen(false)}
          title={title || resolveLocalizedText(flowDetail.title, '未命名资产')}
          versions={versions}
          isPublished={Boolean(flowDetail.release)}
          lastPublishedAt={flowDetail.last_publish_time || flowDetail.release_time}
          publishLoading={saving || deliveryToken.isCreating}
          publishedShareUrl={publishedShareUrl}
          tokenReady={Boolean(deliveryToken.token)}
          onPublish={handlePublish}
          onOpenWebhook={() => {
            setVersionsOpen(false)
            setWebhookOpen(true)
          }}
          onOpenExplore={() => navigate(`/agent/${id}/explore`)}
        />
      ) : null}

      {webhookOpen ? (
        <WebhookSheet
          hideModal={() => setWebhookOpen(false)}
          webhookUrl={webhookUrl}
          flow={flowDetail}
        />
      ) : null}

      {settingState.visible ? (
        <SettingDialog hideModal={settingState.hideModal} />
      ) : null}

      <PlaceholderDialog
        open={roadmapOpen}
        onOpenChange={setRoadmapOpen}
        title={
          editorMode === 'pipeline'
            ? 'T6：Pipeline 运行与日志工作台'
            : 'T4：Agent 运行与单步调试工作台'
        }
        description={
          editorMode === 'pipeline'
            ? 'Pipeline 已正式化为独立 workbench：上传/Begin 输入、Pipeline 运行、数据流时间线与 END 输出已串成闭环。'
            : '普通 Agent 已切到统一 runtime workbench，T2/T3 的表单装配和目录化 operator 仍保持正式主路径。'
        }
        bullets={
          editorMode === 'pipeline'
            ? [
                'Pipeline 不再借走 Agent runtime workbench：Run / Log / Output 三视图独立挂载，状态模型与 Agent 互不污染。',
                '使用 useSaveGraph + agentAPI.runAgent + fetchTrace 轮询 + cancelDataflow 形成完整闭环，旧 page-local pipeline bridge 已被接管。',
                'Webhook、Publish、Share 与 Explore 仍按现状，留给后续 T7/T9 阶段补齐。',
              ]
            : [
                '本轮正式化普通 Agent 的 Run / Conversation / Log 单一工作台，并保持 form-sheet renderer 主路径不回退。',
                '单步调试继续挂在 T2 的 form-sheet header 与 canvas context-menu 上，但输入表单与文件上传已经按 T4 统一。',
                'Pipeline run/log 已在 T6 独立工作台正式化；Share/Publish/Webhook/Explore 与 session 浏览仍留给后续 T7/T9。',
              ]
        }
      />
    </>
  )
}
