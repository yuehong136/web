import { useCallback, useEffect, useState, type RefCallback } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { useParams } from 'react-router-dom'
import { isPipelineFlow, resolveLocalizedText } from '@/lib/agent'
import AgentCanvas from '../canvas'
import {
  AgentRuntimeStatus,
  RuntimeWorkbenchView,
  type RuntimeWorkbenchSummary,
} from '../features/runtime-workbench'
import {
  PipelineWorkbenchView,
  type PipelineWorkbenchSummary,
} from '../features/pipeline-workbench'
import { useFetchDataOnMount } from '../hooks/use-fetch-data'
import { useSaveGraph } from '../hooks/use-save-graph'
import { EmbedShell, EmbedWaitingHost } from './embed-shell'
import { EmbedToolbar } from './embed-toolbar'
import { EmbedRuntimeRail } from './embed-runtime-rail'
import type { EmbedAccess } from './use-embed-access'
import type { useEmbedBridge } from './use-embed-bridge'
import type { EmbedNavigateTarget } from './protocol'

interface EmbedAuthorisedProps {
  access: EmbedAccess
  containerRef: RefCallback<HTMLDivElement>
  postToParent: ReturnType<typeof useEmbedBridge>['postToParent']
  triggerSaveRef: React.MutableRefObject<() => void>
}

/**
 * Authorized view: JWT is in place via apiClient patch, so the canvas can
 * be mounted with the real data fetch and save chain. Outbound buttons that
 * would navigate within the platform are bridged to the host instead.
 */
export function EmbedAuthorised({
  access,
  containerRef,
  postToParent,
  triggerSaveRef,
}: EmbedAuthorisedProps) {
  const { id = '' } = useParams<{ id: string }>()
  const { flowDetail, loading } = useFetchDataOnMount()
  const { saveGraph, loading: saving } = useSaveGraph(id)

  const editorMode: 'agent' | 'pipeline' = isPipelineFlow(flowDetail)
    ? 'pipeline'
    : 'agent'

  const defaultRuntimeView =
    editorMode === 'pipeline'
      ? PipelineWorkbenchView.RUN
      : RuntimeWorkbenchView.RUN

  const [title, setTitle] = useState('')
  const [titleDirty, setTitleDirty] = useState(false)
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

  const handleSave = useCallback(async () => {
    if (!id) return
    const nextTitle =
      title.trim() || resolveLocalizedText(flowDetail?.title, '未命名资产')
    const result = await saveGraph(nextTitle)
    if (result) {
      setTitleDirty(false)
      postToParent({
        type: 'save-success',
        agentId: id,
        title: nextTitle,
      })
    } else {
      postToParent({ type: 'save-error', error: '保存失败' })
    }
  }, [id, title, flowDetail?.title, saveGraph, postToParent])

  useEffect(() => {
    triggerSaveRef.current = () => {
      void handleSave()
    }
  }, [handleSave, triggerSaveRef])

  const openRuntimeWorkbench = useCallback(
    (view?: string) => {
      setRuntimeWorkbenchView(view || defaultRuntimeView)
      setRuntimeWorkbenchOpen(true)
    },
    [defaultRuntimeView],
  )

  const navRequest = useCallback(
    (target: EmbedNavigateTarget) => {
      postToParent({ type: 'navigate-request', target })
    },
    [postToParent],
  )

  if (loading || !flowDetail?.id) {
    return (
      <EmbedShell>
        <EmbedWaitingHost parentOrigin={access.parentOrigin} />
      </EmbedShell>
    )
  }

  const toolbar = (
    <EmbedToolbar
      title={title}
      onTitleChange={(next) => {
        setTitleDirty(true)
        setTitle(next)
      }}
      show={access.show}
      onSave={() => void handleSave()}
      saving={saving}
      onRun={access.show.has('run') ? () => openRuntimeWorkbench() : undefined}
      onNavigateRequest={navRequest}
      description={`ID: ${flowDetail.id}`}
    />
  )

  const sidePanel = access.hideRail ? null : (
    <EmbedRuntimeRail
      flow={flowDetail}
      editorMode={editorMode}
      show={access.show}
      runtimeSummary={runtimeSummary}
      onOpenRuntime={openRuntimeWorkbench}
      onNavigateRequest={navRequest}
    />
  )

  return (
    <div ref={containerRef} className="h-screen w-screen">
      <EmbedShell toolbar={toolbar} sidePanel={sidePanel}>
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
      </EmbedShell>
    </div>
  )
}
