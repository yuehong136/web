import { useSetModalState } from '@/hooks/common-hooks'
import type { ReactFlowInstance } from '@xyflow/react'
import {
  ConnectionMode,
  ControlButton,
  Controls,
  Position,
  ReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { NotebookPen } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormSheet } from '../components/FormSheet'
import {
  AgentChatContext,
  AgentChatLogContext,
  AgentInstanceContext,
  HandleContext,
} from '../context'
import { useAddNode } from '../hooks/use-add-node'
import { useBeforeDelete } from '../hooks/use-before-delete'
import { useCacheChatLog } from '../hooks/use-cache-chat-log'
import { useConnectionDrag } from '../hooks/use-connection-drag'
import { useDropdownPosition } from '../hooks/use-dropdown-position'
import { useHideFormSheetOnNodeDeletion, useShowDrawer, useShowLogSheet } from '../hooks/use-show-drawer'
import { useMoveNote } from '../hooks/use-move-note'
import { useNodeLoading } from '../hooks/use-node-loading'
import { usePlaceholderManager } from '../hooks/use-placeholder-manager'
import { useSelectCanvasData } from '../hooks/use-select-canvas-data'
import { useStopMessageUnmount } from '../hooks/use-stop-message'
import { useValidateConnection } from '../hooks/use-validate-connection'
import { DropdownProvider, useDropdownManager } from './context'
import { ButtonEdge } from './edge'
import { ChatSheet } from '../chat/chat-sheet'
import { LogSheet } from '../log-sheet'
import RunSheet from '../run-sheet'
import { NextStepDropdown } from './node/dropdown/next-step-dropdown'
import { nodeTypes } from './node-types'
import { CanvasContextMenu } from './context-menu'
import { SingleDebugSheet } from './single-debug-sheet'
import { useParams } from 'react-router-dom'
import { AgentBackground } from '@/components/canvas/background'
import Spotlight from '@/components/spotlight'
import {
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const edgeTypes = {
  buttonEdge: ButtonEdge,
}

interface AgentCanvasProps {
  drawerVisible?: boolean
  hideDrawer?: () => void
}

function AgentCanvasInner({ drawerVisible, hideDrawer }: AgentCanvasProps) {
  const { t } = useTranslation()
  const { id: canvasId } = useParams<{ id: string }>()
  const resolvedDrawerVisible = drawerVisible ?? false
  const resolvedHideDrawer = hideDrawer ?? (() => {})
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

  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance<any, any>>()

  const {
    onNodeClick,
    clickedNode,
    formDrawerVisible,
    hideFormDrawer,
    chatVisible,
    runVisible,
    hideRunOrChatDrawer,
    showChatModal,
    showFormDrawer,
  } = useShowDrawer({
    drawerVisible: resolvedDrawerVisible,
    hideDrawer: resolvedHideDrawer,
  })

  const {
    addEventList,
    setCurrentMessageId,
    currentEventListWithoutMessageById,
    clearEventList,
    currentMessageId,
    latestTaskId,
  } = useCacheChatLog()

  const { stopMessage } = useStopMessageUnmount(chatVisible, latestTaskId)

  const { showLogSheet, logSheetVisible, hideLogSheet } = useShowLogSheet({
    setCurrentMessageId,
  })
  const [lastSendLoading, setLastSendLoading] = useState(false)
  const [currentSendLoading, setCurrentSendLoading] = useState(false)

  const { handleBeforeDelete } = useBeforeDelete()

  const { addCanvasNode, addNoteNode } = useAddNode(reactFlowInstance)

  const { ref, showImage, hideImage, imgVisible, mouse } = useMoveNote()

  useEffect(() => {
    if (!chatVisible) {
      stopMessage(latestTaskId)
      clearEventList()
    }
  }, [chatVisible, clearEventList, latestTaskId, stopMessage])

  const setLastSendLoadingFunc = (loading: boolean, messageId: string) => {
    setCurrentSendLoading(!!loading)
    if (messageId === currentMessageId) {
      setLastSendLoading(loading)
    } else {
      setLastSendLoading(false)
    }
  }

  useHideFormSheetOnNodeDeletion({ hideFormDrawer })
  const [singleDebugNodeId, setSingleDebugNodeId] = useState<string | null>(null)
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

  const handleShowSingleDebug = useCallback((nodeId: string) => {
    setSingleDebugNodeId(nodeId)
  }, [])

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

  const { lastNode, setDerivedMessages, startButNotFinishedNodeIds } =
    useNodeLoading({
      currentEventListWithoutMessageById,
    })

  return (
    <div className="w-full h-full px-space-lg pb-space-lg bg-surface-secondary">
      {/* SVG 标记定义 */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', top: 10, left: 0 }}
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
          lastNode: lastNode?.data?.component_id,
          currentSendLoading,
          startButNotFinishedNodeIds,
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
          nodeOrigin={[0.5, 0]}
          isValidConnection={isValidConnection}
          onEdgeMouseEnter={onEdgeMouseEnter}
          onEdgeMouseLeave={onEdgeMouseLeave}
          className="h-full"
          defaultEdgeOptions={{
            type: 'buttonEdge',
            markerEnd: 'logo',
            zIndex: 1001,
          }}
          deleteKeyCode={['Delete', 'Backspace']}
          onBeforeDelete={handleBeforeDelete}
          proOptions={{ hideAttribution: true }}
        >
          <AgentBackground />
          <Spotlight className="z-0" opcity={0.7} coverage={70} />
          <Controls
            position={'bottom-center'}
            orientation="horizontal"
            className="bg-surface-primary px-space-base py-space-sm h-auto w-auto [&>button]:bg-transparent [&>button]:border-0 [&>button]:text-text-primary [&>button]:hover:bg-surface-secondary [&>button]:p-0 [&>button]:size-4 gap-space-sm rounded-radius-md shadow-elevation-low"
          >
            <ControlButton>
              <TooltipProvider delayDuration={200}>
                <TooltipRoot>
                  <TooltipTrigger asChild>
                    <NotebookPen className="!fill-none size-4" onClick={showImage} />
                  </TooltipTrigger>
                  <TooltipContent>{t('flow.note', '笔记')}</TooltipContent>
                </TooltipRoot>
              </TooltipProvider>
            </ControlButton>
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
          className={`hidden absolute size-6 ${imgVisible ? 'block' : ''}`}
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
            />
          </AgentInstanceContext.Provider>
        )}

        {chatVisible && (
          <AgentChatContext.Provider
            value={{ showLogSheet, setLastSendLoadingFunc, setDerivedMessages }}
          >
            <AgentChatLogContext.Provider
              value={{ addEventList, setCurrentMessageId }}
            >
              <ChatSheet hideModal={hideRunOrChatDrawer} />
            </AgentChatLogContext.Provider>
          </AgentChatContext.Provider>
        )}

        {runVisible && (
          <RunSheet hideModal={hideRunOrChatDrawer} showModal={showChatModal} />
        )}

        {logSheetVisible && (
          <LogSheet
            hideModal={hideLogSheet}
            currentEventListWithoutMessageById={
              currentEventListWithoutMessageById
            }
            currentMessageId={currentMessageId}
            sendLoading={lastSendLoading}
          />
        )}

        <CanvasContextMenu
          open={contextMenu.open}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          nodeId={contextMenu.nodeId}
          onOpenChange={(open) =>
            setContextMenu((prev) => ({ ...prev, open }))
          }
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
