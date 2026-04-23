import { useEffect, useMemo, useState } from 'react'
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
  resolveLocalizedText,
} from '@/lib/agent'
import {
  useFetchVersionList,
} from '@/hooks/use-agent-request'
import { useFetchDataOnMount } from './hooks/use-fetch-data'
import { useWatchAgentChange } from './hooks/use-watch-agent-change'
import { useBuildWebhookUrl } from './hooks/use-build-webhook-url'
import { useSaveGraph } from './hooks/use-save-graph'
import AgentCanvas from './canvas'
import { EditorRuntimeRail } from './components/editor-runtime-rail'
import { PlaceholderDialog } from './components/placeholder-dialog'
import {
  AgentRuntimeStatus,
  RuntimeWorkbenchView,
  type RuntimeWorkbenchSummary,
} from './features/runtime-workbench'
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
  const autosaveLabel = useWatchAgentChange()
  const versionQuery = useFetchVersionList(id)
  const webhookUrl = useBuildWebhookUrl()

  const [title, setTitle] = useState('')
  const [titleDirty, setTitleDirty] = useState(false)
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [webhookOpen, setWebhookOpen] = useState(false)
  const [roadmapOpen, setRoadmapOpen] = useState(false)
  const [runtimeWorkbenchOpen, setRuntimeWorkbenchOpen] = useState(false)
  const [runtimeWorkbenchView, setRuntimeWorkbenchView] = useState(
    RuntimeWorkbenchView.RUN,
  )
  const [runtimeSummary, setRuntimeSummary] = useState<RuntimeWorkbenchSummary>({
    status: AgentRuntimeStatus.IDLE,
    currentView: RuntimeWorkbenchView.RUN,
    messageCount: 0,
    hasLogs: false,
  })
  const settingState = useSetModalState(false)

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

  const openRuntimeWorkbench = (view: RuntimeWorkbenchView) => {
    setRuntimeWorkbenchView(view)
    setRuntimeWorkbenchOpen(true)
  }

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
                  <Button variant="outline" onClick={() => navigate(`/agent/${id}/explore`)}>
                    <Compass className="mr-space-xs h-4 w-4" />
                    Explore
                  </Button>
                  <Button variant="outline" onClick={() => setVersionsOpen(true)}>
                    <History className="mr-space-xs h-4 w-4" />
                    版本
                  </Button>
                  <Button variant="outline" onClick={() => setWebhookOpen(true)}>
                    <Link2 className="mr-space-xs h-4 w-4" />
                    Webhook
                  </Button>
                  <Button variant="outline" onClick={() => navigate(`/agent/share?id=${id}`)}>
                    <Share2 className="mr-space-xs h-4 w-4" />
                    Share
                  </Button>
                  <Button variant="outline" onClick={settingState.showModal}>
                    <Settings2 className="mr-space-xs h-4 w-4" />
                    设置
                  </Button>
                  <Button variant="secondary" onClick={handleSave} disabled={saving}>
                    <Save className="mr-space-xs h-4 w-4" />
                    {saving ? '保存中...' : '保存'}
                  </Button>
                  <Button onClick={() => openRuntimeWorkbench(RuntimeWorkbenchView.RUN)}>
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
                  T4 已正式化普通 Agent 的运行、Conversation 与单步调试工作台。
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
            autosaveLabel={autosaveLabel}
            runtimeSummary={runtimeSummary}
            onOpenRuntime={openRuntimeWorkbench}
            onOpenExplore={() => navigate(`/agent/${id}/explore`)}
            onOpenVersions={() => setVersionsOpen(true)}
            onOpenWebhook={() => setWebhookOpen(true)}
            onOpenSettings={settingState.showModal}
            onOpenShare={() => navigate(`/agent/share?id=${id}`)}
            onOpenRoadmap={() => setRoadmapOpen(true)}
          />
        }
      >
        <ReactFlowProvider>
          <AgentCanvas
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
          versions={versions}
        />
      ) : null}

      {webhookOpen ? (
        <WebhookSheet
          hideModal={() => setWebhookOpen(false)}
          webhookUrl={webhookUrl}
        />
      ) : null}

      {settingState.visible ? (
        <SettingDialog hideModal={settingState.hideModal} />
      ) : null}

      <PlaceholderDialog
        open={roadmapOpen}
        onOpenChange={setRoadmapOpen}
        title="T4：Agent 运行与单步调试工作台"
        description="普通 Agent 已切到统一 runtime workbench，T2/T3 的表单装配和目录化 operator 仍保持正式主路径。"
        bullets={[
          '本轮正式化普通 Agent 的 Run / Conversation / Log 单一工作台，并保持 form-sheet renderer 主路径不回退。',
          '单步调试继续挂在 T2 的 form-sheet header 与 canvas context-menu 上，但输入表单与文件上传已经按 T4 统一。',
          'Pipeline run/log、Share/Publish/Webhook/Explore 与 session 浏览仍留给后续 T6/T7/T9，不在本轮越界实现。',
        ]}
      />
    </>
  )
}
