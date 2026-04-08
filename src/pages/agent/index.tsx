import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import { formatVersionLabel, resolveLocalizedText } from '@/lib/agent'
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
  const { id = '' } = useParams<{ id: string }>()
  const { flowDetail, loading } = useFetchDataOnMount()
  const { saveGraph, loading: saving } = useSaveGraph(id)
  const autosaveLabel = useWatchAgentChange()
  const versionQuery = useFetchVersionList(id)
  const webhookUrl = useBuildWebhookUrl()

  const [title, setTitle] = useState('')
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [titleDirty, setTitleDirty] = useState(false)
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [webhookOpen, setWebhookOpen] = useState(false)
  const [roadmapOpen, setRoadmapOpen] = useState(false)
  const settingState = useSetModalState(false)

  useEffect(() => {
    if (!titleDirty && flowDetail?.title) {
      setTitle(resolveLocalizedText(flowDetail.title, '未命名资产'))
    }
  }, [flowDetail?.title, titleDirty])

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
                  <Button onClick={() => setDrawerVisible(true)}>
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
                  第一阶段已完成编辑器骨架、右侧运行轨与统一请求层接线。
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
            drawerVisible={drawerVisible}
            hideDrawer={() => setDrawerVisible(false)}
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
        title="阶段一已完成的骨架"
        description="这里先把大框架、入口和状态反馈固定住，后续再逐个替换旧节点表单和运行体验。"
        bullets={[
          '已切换到新的 Agent Center / 模板页 / 编辑器页 / Explore 页 / Share 页路由结构。',
          '已统一共享类型、API 与 query/mutation hooks，后续节点和弹窗可以直接增量接入。',
          '当前 Canvas 仍复用旧内核，接下来会逐步把节点表单、日志时间线、分享发布能力拆成目录化模块。',
        ]}
      />
    </>
  )
}
