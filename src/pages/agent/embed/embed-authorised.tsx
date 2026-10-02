import { useCallback, useEffect, useState, type RefCallback } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { useEmbedEditorActions } from './use-embed-editor-actions'
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
 * be mounted with the real data fetch and save chain. Editor actions open the
 * same local dialogs/sheets as the full editor; only true route exits are
 * bridged to the host.
 */
export function EmbedAuthorised({
  access,
  containerRef,
  postToParent,
  triggerSaveRef,
}: EmbedAuthorisedProps) {
  const { t } = useTranslation()
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

  const resetInputs0 = [buildIdleSummary, defaultRuntimeView, editorMode]
  const [previousInputs0, setPreviousInputs0] = useState<unknown[] | null>(null)
  if (
    previousInputs0 === null ||
    resetInputs0.some(
      (value, index) => !Object.is(value, previousInputs0[index]),
    )
  ) {
    setPreviousInputs0(resetInputs0)

    setRuntimeWorkbenchOpen(false)
    setRuntimeWorkbenchView(defaultRuntimeView)
    setRuntimeSummary(buildIdleSummary())
  }

  const resetInputs1 = [flowDetail?.title, t, titleDirty]
  const [previousInputs1, setPreviousInputs1] = useState<unknown[] | null>(null)
  if (
    previousInputs1 === null ||
    resetInputs1.some(
      (value, index) => !Object.is(value, previousInputs1[index]),
    )
  ) {
    setPreviousInputs1(resetInputs1)

    if (!titleDirty && flowDetail?.title) {
      setTitle(
        resolveLocalizedText(
          flowDetail.title,
          t('agent.unnamedAsset', '未命名资产'),
        ),
      )
    }
  }

  const handleSave = useCallback(async () => {
    if (!id) return
    const nextTitle =
      title.trim() ||
      resolveLocalizedText(
        flowDetail?.title,
        t('agent.unnamedAsset', '未命名资产'),
      )
    const result = await saveGraph(nextTitle)
    if (result) {
      setTitleDirty(false)
      postToParent({
        type: 'save-success',
        agentId: id,
        title: nextTitle,
      })
    } else {
      postToParent({
        type: 'save-error',
        error: t('agent.editor.saveFailed', '保存失败'),
      })
    }
  }, [id, title, flowDetail?.title, saveGraph, postToParent, t])

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

  const editorActions = useEmbedEditorActions({
    id,
    flow: flowDetail,
    editorMode,
    title,
    saving,
    saveGraph,
    onExplore: () => navRequest('explore'),
    onTitleSaved: (nextTitle) => {
      setTitle(nextTitle)
      setTitleDirty(false)
    },
  })

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
      onOpenVersions={editorActions.openVersions}
      onOpenWebhook={editorActions.openWebhook}
      onOpenVariables={editorActions.openVariables}
      onOpenSettings={editorActions.openSettings}
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
      onOpenVersions={editorActions.openVersions}
      onOpenWebhook={editorActions.openWebhook}
      onOpenVariables={editorActions.openVariables}
      onOpenSettings={editorActions.openSettings}
    />
  )

  return (
    <>
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

      {editorActions.panels}
    </>
  )
}
