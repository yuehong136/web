import { useSetModalState } from '@/hooks/common-hooks'
import {
  ConnectionMode,
  ControlButton,
  Controls,
  Position,
  ReactFlow,
  type Edge,
  type ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import './overrides.css'
import { NotebookPen } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormSheet } from '../features/form-sheet'
import {
  RuntimeWorkbench,
  RuntimeWorkbenchView,
} from '../features/runtime-workbench'
import { useAgentRuntimeWorkbench } from '../features/runtime-workbench/hooks/use-agent-runtime-workbench'
import type { RuntimeWorkbenchSummary } from '../features/runtime-workbench'
import {
  PipelineWorkbench,
  PipelineWorkbenchView,
  type PipelineWorkbenchSummary,
} from '../features/pipeline-workbench'
import { usePipelineWorkbench } from '../features/pipeline-workbench/hooks/use-pipeline-workbench'
import { AgentInstanceContext, HandleContext } from '../context'
import { useAddNode } from '../hooks/use-add-node'
import { useBeforeDelete } from '../hooks/use-before-delete'
import { useConnectionDrag } from '../hooks/use-connection-drag'
import { useDropdownPosition } from '../hooks/use-dropdown-position'
import {
  useHideFormSheetOnNodeDeletion,
  useShowDrawer,
} from '../hooks/use-show-drawer'
import { useMoveNote } from '../hooks/use-move-note'
import { usePlaceholderManager } from '../hooks/use-placeholder-manager'
import { useSelectCanvasData } from '../hooks/use-select-canvas-data'
import { useValidateConnection } from '../hooks/use-validate-connection'
import { DropdownProvider, useDropdownManager } from './context'
import type { RAGFlowNodeType } from '../types'
import { NextStepDropdown } from './node/dropdown/next-step-dropdown'
import { edgeTypes, nodeTypes } from './node-types'
import { CanvasContextMenu } from './context-menu'
import { SingleDebugSheet } from './single-debug-sheet'
import { useParams } from 'react-router-dom'
import { AgentBackground } from '@/components/canvas/background'
import Spotlight from '@/components/spotlight'
import { useIsDarkTheme } from '@/themes'
import { cn } from '@/lib/utils'
import {
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const defaultEdgeOptions = {
  type: 'buttonEdge',
  markerEnd: 'logo',
  zIndex: 1001,
}

const nodeOrigin: [number, number] = [0.5, 0]

const reactFlowProOptions = { hideAttribution: true }

const deleteKeyCode = ['Delete', 'Backspace']

// Utilities outrank xyflow's `@layer xyflow` rules (see
// styles/application-reset.css), so the floating bar is styled here.
const controlsClassName = cn(
  'h-auto w-auto items-center gap-space-2xs rounded-radius-lg border border-border-subtle bg-components-canvas-node-bg p-space-2xs text-text-secondary shadow-elevation-medium',
  '[&>button]:size-7 [&>button]:rounded-radius-md [&>button]:border-0 [&>button]:bg-transparent [&>button]:p-0 [&>button]:text-inherit [&>button]:transition-colors motion-reduce:[&>button]:transition-none',
  '[&>button:hover]:bg-state-hover [&>button:hover]:text-text-primary [&>button:focus-visible]:outline-2 [&>button:focus-visible]:outline-state-focus',
  '[&>button>svg]:size-icon-xs',
)

interface AgentCanvasProps {
  editorMode: 'agent' | 'pipeline'
  runtimeWorkbenchOpen: boolean
  runtimeWorkbenchView: string
  onRuntimeWorkbenchOpenChange: (open: boolean) => void
  onRuntimeWorkbenchViewChange: (view: string) => void
  onRuntimeSummaryChange?: (
    summary: RuntimeWorkbenchSummary | PipelineWorkbenchSummary,
  ) => void
}

function AgentCanvasInner({
  editorMode,
  runtimeWorkbenchOpen,
  runtimeWorkbenchView,
  onRuntimeWorkbenchOpenChange,
  onRuntimeWorkbenchViewChange,
  onRuntimeSummaryChange,
}: AgentCanvasProps) {
  const { t } = useTranslation()
  const { id: canvasId } = useParams<{ id: string }>()
  const isDark = useIsDarkTheme()
  const {
    nodes,
    edges,
    onConnect: originalOnConnect,
    onEdgesChange,
    onNodesChange,
    onSelectionChange,
    onEdgeMouseEnter,
    onEdgeMouseLeave,
  } = useSelectCanvasData()
  const isValidConnection = useValidateConnection()
  const ariaLabelConfig = useMemo(
    () => ({
      'controls.ariaLabel': t('agent.canvas.controls.label'),
      'controls.zoomIn.ariaLabel': t('agent.canvas.controls.zoomIn'),
      'controls.zoomOut.ariaLabel': t('agent.canvas.controls.zoomOut'),
      'controls.fitView.ariaLabel': t('agent.canvas.controls.fitView'),
      'controls.interactive.ariaLabel': t('agent.canvas.controls.interactive'),
    }),
    [t],
  )

  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance<RAGFlowNodeType, Edge>>()
  const [singleDebugNodeId, setSingleDebugNodeId] = useState<string | null>(
    null,
  )

  const handleShowSingleDebug = useCallback((nodeId: string) => {
    setSingleDebugNodeId(nodeId)
  }, [])

  const {
    onNodeClick,
    clickedNode,
    formDrawerVisible,
    hideFormDrawer,
    showFormDrawer,
  } = useShowDrawer({
    onOpenSingleDebug: handleShowSingleDebug,
  })

  const { handleBeforeDelete } = useBeforeDelete()

  const { addCanvasNode, addNoteNode } = useAddNode(reactFlowInstance)

  const { ref, showImage, hideImage, imgVisible, mouse } = useMoveNote()

  useHideFormSheetOnNodeDeletion({ hideFormDrawer })
  const [contextMenu, setContextMenu] = useState<{
    open: boolean
    x: number
    y: number
    nodeId?: string | null
  }>({ open: false, x: 0, y: 0, nodeId: null })

  // 下拉菜单状态
  const { visible, hideModal, showModal } = useSetModalState()
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 })

  const { clearActiveDropdown } = useDropdownManager()

  const {
    removePlaceholderNode,
    onNodeCreated,
    setCreatedPlaceholderRef,
    checkAndRemoveExistingPlaceholder,
  } = usePlaceholderManager(reactFlowInstance)

  const { calculateDropdownPosition } = useDropdownPosition(reactFlowInstance)

  const {
    onConnectStart,
    onConnectEnd,
    handleConnect,
    getConnectionStartContext,
    shouldPreventClose,
    onMove,
    nodeId,
  } = useConnectionDrag(
    originalOnConnect,
    showModal,
    hideModal,
    setDropdownPosition,
    setCreatedPlaceholderRef,
    calculateDropdownPosition,
    removePlaceholderNode,
    clearActiveDropdown,
    checkAndRemoveExistingPlaceholder,
    reactFlowInstance,
  )

  const handleNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: { id: string }) => {
      e.preventDefault()
      setContextMenu({
        open: true,
        x: e.clientX,
        y: e.clientY,
        nodeId: node.id,
      })
    },
    [],
  )

  const handleCloseSingleDebug = useCallback(() => {
    setSingleDebugNodeId(null)
  }, [])

  // 画布点击处理
  const onPaneClick = useCallback(() => {
    hideFormDrawer()
    setContextMenu((prev) => ({ ...prev, open: false }))
    if (visible && !shouldPreventClose()) {
      removePlaceholderNode()
      hideModal()
      clearActiveDropdown()
    }
    if (imgVisible) {
      addNoteNode(mouse)
      hideImage()
    }
  }, [
    hideFormDrawer,
    visible,
    shouldPreventClose,
    hideModal,
    clearActiveDropdown,
    removePlaceholderNode,
    imgVisible,
    addNoteNode,
    mouse,
    hideImage,
  ])

  const isPipelineMode = editorMode === 'pipeline'

  const agentRuntimeController = useAgentRuntimeWorkbench({
    canvasId,
    currentView: isPipelineMode
      ? RuntimeWorkbenchView.RUN
      : (runtimeWorkbenchView as RuntimeWorkbenchView),
    onViewChange: (next) => onRuntimeWorkbenchViewChange(next),
    onSummaryChange: isPipelineMode ? undefined : onRuntimeSummaryChange,
  })

  const pipelineController = usePipelineWorkbench({
    canvasId,
    currentView: isPipelineMode
      ? (runtimeWorkbenchView as PipelineWorkbenchView)
      : PipelineWorkbenchView.RUN,
    onViewChange: (next) => onRuntimeWorkbenchViewChange(next),
    onSummaryChange: isPipelineMode ? onRuntimeSummaryChange : undefined,
  })

  const railLastNodeId = isPipelineMode
    ? undefined
    : agentRuntimeController.lastNodeId
  const railSendLoading = isPipelineMode
    ? pipelineController.loading
    : agentRuntimeController.loading
  const railStartButNotFinishedNodeIds = isPipelineMode
    ? []
    : agentRuntimeController.startButNotFinishedNodeIds
  const railSuccessNodeIds = isPipelineMode
    ? []
    : agentRuntimeController.successNodeIds
  const railErrorNodeIds = isPipelineMode
    ? []
    : agentRuntimeController.errorNodeIds
  const railNodeElapsedMap = isPipelineMode
    ? {}
    : agentRuntimeController.nodeElapsedMap

  return (
    <div className="h-full w-full bg-surface-secondary">
      {/* SVG 标记定义 - 仅用于声明 <defs>，不参与交互或布局 */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={0}
        height={0}
        style={{ position: 'absolute', pointerEvents: 'none' }}
        aria-hidden
      >
        <defs>
          <marker
            fill="var(--color-components-canvas-edge-marker-selected)"
            id="selected-marker"
            viewBox="0 0 40 40"
            refX="8"
            refY="5"
            markerUnits="strokeWidth"
            markerWidth="20"
            markerHeight="20"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
          <marker
            fill="var(--color-components-canvas-edge-marker)"
            id="logo"
            viewBox="0 0 40 40"
            refX="8"
            refY="5"
            markerUnits="strokeWidth"
            markerWidth="20"
            markerHeight="20"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
      </svg>

      <AgentInstanceContext.Provider
        value={{
          addCanvasNode,
          showFormDrawer,
          lastNode: railLastNodeId,
          currentSendLoading: railSendLoading,
          startButNotFinishedNodeIds: railStartButNotFinishedNodeIds,
          successNodeIds: railSuccessNodeIds,
          errorNodeIds: railErrorNodeIds,
          nodeElapsedMap: railNodeElapsedMap,
        }}
      >
        <ReactFlow
          connectionMode={ConnectionMode.Loose}
          nodes={nodes}
          onNodesChange={onNodesChange}
          edges={edges}
          onEdgesChange={onEdgesChange}
          fitView
          onConnect={handleConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onMove={onMove}
          onNodeClick={onNodeClick}
          onNodeContextMenu={handleNodeContextMenu}
          onPaneClick={onPaneClick}
          onInit={setReactFlowInstance}
          onSelectionChange={onSelectionChange}
          nodeOrigin={nodeOrigin}
          isValidConnection={isValidConnection}
          onEdgeMouseEnter={onEdgeMouseEnter}
          onEdgeMouseLeave={onEdgeMouseLeave}
          className="h-full"
          // xyflow 13 infers the scheme from the DOM; pin the app's resolved one.
          forceColorMode={isDark ? 'dark' : 'light'}
          // v13 raises edges of selected nodes by default; keep v12 layering.
          elevateEdgesOnSelect={false}
          defaultEdgeOptions={defaultEdgeOptions}
          deleteKeyCode={deleteKeyCode}
          onBeforeDelete={handleBeforeDelete}
          proOptions={reactFlowProOptions}
          ariaLabelConfig={ariaLabelConfig}
        >
          <AgentBackground />
          <Spotlight className="z-0" opcity={0.7} coverage={70} />
          <Controls
            position="bottom-center"
            orientation="horizontal"
            className={controlsClassName}
          >
            <TooltipProvider delayDuration={200}>
              <TooltipRoot>
                <TooltipTrigger asChild>
                  <ControlButton
                    onClick={showImage}
                    aria-label={t('flow.note', '笔记')}
                  >
                    <NotebookPen aria-hidden className="fill-none" />
                  </ControlButton>
                </TooltipTrigger>
                <TooltipContent>{t('flow.note', '笔记')}</TooltipContent>
              </TooltipRoot>
            </TooltipProvider>
          </Controls>
        </ReactFlow>
        {/* 下拉节点选择菜单 */}
        {visible && (
          <HandleContext.Provider
            value={
              getConnectionStartContext() || {
                nodeId: '',
                id: '',
                type: 'source',
                position: Position.Right,
                isFromConnectionDrag: true,
              }
            }
          >
            <NextStepDropdown
              hideModal={() => {
                removePlaceholderNode()
                hideModal()
                clearActiveDropdown()
              }}
              position={dropdownPosition}
              onNodeCreated={onNodeCreated}
              nodeId={nodeId}
            />
          </HandleContext.Provider>
        )}

        <NotebookPen
          className={`absolute hidden size-6 ${imgVisible ? 'block' : ''}`}
          ref={ref}
        />

        {formDrawerVisible && (
          <AgentInstanceContext.Provider
            value={{ addCanvasNode, showFormDrawer }}
          >
            <FormSheet
              open={formDrawerVisible}
              node={clickedNode}
              onClose={hideFormDrawer}
              runtimeDrawerVisible={runtimeWorkbenchOpen}
              canvasId={canvasId}
            />
          </AgentInstanceContext.Provider>
        )}

        {isPipelineMode ? (
          <PipelineWorkbench
            open={runtimeWorkbenchOpen}
            view={runtimeWorkbenchView as PipelineWorkbenchView}
            controller={pipelineController}
            onOpenChange={onRuntimeWorkbenchOpenChange}
            onViewChange={(next) => onRuntimeWorkbenchViewChange(next)}
          />
        ) : (
          <RuntimeWorkbench
            open={runtimeWorkbenchOpen}
            view={runtimeWorkbenchView as RuntimeWorkbenchView}
            controller={agentRuntimeController}
            onOpenChange={onRuntimeWorkbenchOpenChange}
            onViewChange={(next) => onRuntimeWorkbenchViewChange(next)}
          />
        )}

        <CanvasContextMenu
          open={contextMenu.open}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          nodeId={contextMenu.nodeId}
          onOpenChange={(open) => setContextMenu((prev) => ({ ...prev, open }))}
          onDebug={handleShowSingleDebug}
        />

        <SingleDebugSheet
          open={Boolean(singleDebugNodeId)}
          canvasId={canvasId}
          componentId={singleDebugNodeId ?? undefined}
          onClose={handleCloseSingleDebug}
        />
      </AgentInstanceContext.Provider>
    </div>
  )
}

export default function AgentCanvas(props: AgentCanvasProps) {
  return (
    <DropdownProvider>
      <AgentCanvasInner {...props} />
    </DropdownProvider>
  )
}
