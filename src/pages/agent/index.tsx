import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ReactFlowProvider } from '@xyflow/react'
import { StudioPageTemplate } from '@/components/page-templates'
import {
  AppScene,
  PageErrorState,
  PageHeader,
  PageLoadingState,
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
import { useFetchVersionList } from '@/hooks/use-agent-request'
import { toast } from '@/lib/toast'
import { useFetchDataOnMount } from './hooks/use-fetch-data'
import { useAgentDeliveryToken } from './hooks/use-agent-delivery-token'
import { useWatchAgentChange } from './hooks/use-watch-agent-change'
import { useBuildWebhookUrl } from './hooks/use-build-webhook-url'
import { useSaveGraph } from './hooks/use-save-graph'
import { buildAgentShareUrl } from './share/access'
import { ShareEmbedDialog } from './share/share-embed-dialog'
import { GlobalVariableSheet } from './global-variable-sheet'
import AgentCanvas from './canvas'
import { EditorRuntimeRail } from './components/editor-runtime-rail'
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
import { ArrowLeft, Play, Save } from 'lucide-react'

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
  const [shareOpen, setShareOpen] = useState(false)
  const [globalVariablesOpen, setGlobalVariablesOpen] = useState(false)
  const [publishedShareUrl, setPublishedShareUrl] = useState('')
  const defaultRuntimeView =
    editorMode === 'pipeline'
      ? PipelineWorkbenchView.RUN
      : RuntimeWorkbenchView.RUN
  const [runtimeWorkbenchOpen, setRuntimeWorkbenchOpen] = useState(false)
  const [runtimeWorkbenchView, setRuntimeWorkbenchView] =
    useState<string>(defaultRuntimeView)
  const buildIdleSummary = useCallback(():
    | RuntimeWorkbenchSummary
    | PipelineWorkbenchSummary => {
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

    const nextTitle =
      title.trim() || resolveLocalizedText(flowDetail?.title, '未命名资产')
    await saveGraph(nextTitle)
    setTitleDirty(false)
  }

  const handlePublish = async (note: string) => {
    if (!id) {
      return
    }

    try {
      const nextTitle =
        title.trim() || resolveLocalizedText(flowDetail?.title, '未命名资产')
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
    setShareOpen(true)
    await deliveryToken.refetch()
  }, [deliveryToken])

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
    [
      defaultRuntimeView,
      editorMode,
      runtimeSummary.hasLogs,
      runtimeSummary.status,
    ],
  )

  if (loading) {
    return (
      <PageLoadingState
        scene={AppScene.STUDIO}
        title="正在打开 Agent 编辑器"
        description="正在加载画布、节点配置和运行状态。"
      />
    )
  }

  if (!flowDetail?.id) {
    return (
      <PageErrorState
        scene={AppScene.STUDIO}
        title="未找到 Agent 资产"
        description="请从智能体列表重新打开，或确认当前资产仍然可用。"
        onRetry={() => navigate('/agents')}
        retryLabel="返回智能体列表"
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
              align="center"
              surface="elevated"
              className="shadow-elevation-medium border-b-0"
              title={
                <div className="gap-space-sm flex min-w-[280px] max-w-xl items-center">
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
                  <Button
                    variant="secondary"
                    onClick={handleSave}
                    disabled={saving}
                  >
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
            onOpenVariables={() => setGlobalVariablesOpen(true)}
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
          lastPublishedAt={
            flowDetail.last_publish_time || flowDetail.release_time
          }
          publishLoading={saving || deliveryToken.isLoading}
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

      {shareOpen ? (
        <ShareEmbedDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          agentId={id}
          title={title || resolveLocalizedText(flowDetail.title, '未命名资产')}
          betaToken={deliveryToken.token}
          releaseDefault={Boolean(flowDetail.release)}
          tokenLoading={deliveryToken.isLoading}
          tokenError={deliveryToken.isError}
          onRefreshToken={() => {
            void deliveryToken.refetch()
          }}
        />
      ) : null}

      {webhookOpen ? (
        <WebhookSheet
          hideModal={() => setWebhookOpen(false)}
          webhookUrl={webhookUrl}
          flow={flowDetail}
        />
      ) : null}

      {globalVariablesOpen && editorMode === 'agent' ? (
        <GlobalVariableSheet hideModal={setGlobalVariablesOpen} />
      ) : null}

      {settingState.visible ? (
        <SettingDialog hideModal={settingState.hideModal} />
      ) : null}
    </>
  )
}
