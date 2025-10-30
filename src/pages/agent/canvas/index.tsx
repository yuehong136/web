import {
  ConnectionMode,
  Controls,
  ReactFlow,
  Position,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useState } from 'react'
import useGraphStore from '../store'
import { nodeTypes } from './node-types'
import { ButtonEdge } from './edge'
import { NodeSelectorPanel } from './node/dropdown/NodeSelectorPanel'
import { AgentInstanceContext, HandleContext } from '../context'
import { useAddNode } from '../hooks/use-add-node'
import { FormSheet } from '../components/FormSheet'

const edgeTypes = {
  buttonEdge: ButtonEdge,
}

interface AgentCanvasProps {
  onNodeClick?: (nodeId: string) => void
}

export default function AgentCanvas({ onNodeClick: _onNodeClick }: AgentCanvasProps) {
  const [showFormSheet, setShowFormSheet] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const getNode = useGraphStore(state => state.getNode)
  const reactFlowInstance = useReactFlow()
  const [showNodeSelector, setShowNodeSelector] = useState(false)
  const [selectorPosition, setSelectorPosition] = useState({ x: 0, y: 0 })
  const [connectionStart, setConnectionStart] = useState<{
    nodeId: string
    handleId: string
  } | null>(null)
  const {
    nodes,
    edges,
    onConnect,
    onEdgesChange,
    onNodesChange,
    onSelectionChange,
    onEdgeMouseEnter,
    onEdgeMouseLeave,
  } = useGraphStore()

  // 输出画布状态（只在开发环境）
  if (import.meta.env.DEV) {
    console.log('🎨 [AgentCanvas] nodes:', nodes.length, 'edges:', edges.length)
  }

  const { addCanvasNode } = useAddNode(reactFlowInstance)

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: { id: string }) => {
      console.log('🖱️ [点击节点]', node.id)
      // 排除Note和Placeholder节点
      if (node.id.startsWith('Note:') || node.id.startsWith('Placeholder:')) {
        return
      }
      // 打开右侧表单抽屉
      setSelectedNodeId(node.id)
      setShowFormSheet(true)
    },
    [],
  )

  // 连接开始时记录起始节点
  const handleConnectStart = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_event: any, params: any) => {
      if (params?.nodeId && params?.handleId) {
        setConnectionStart({
          nodeId: params.nodeId,
          handleId: params.handleId,
        })
      }
    },
    [],
  )

  // 连接结束时显示节点选择面板
  const handleConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    if ('clientX' in event && 'clientY' in event) {
      setSelectorPosition({ x: event.clientX, y: event.clientY })
      setShowNodeSelector(true)
    }
  }, [])

  // 点击画布关闭节点选择面板和表单抽屉
  const handlePaneClick = useCallback(() => {
    setShowNodeSelector(false)
    setConnectionStart(null)
    setShowFormSheet(false)
  }, [])

  return (
    <div className="w-full h-full bg-gray-50">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}
      >
        <defs>
          <marker
            fill="rgb(59, 130, 246)"
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
            fill="#9ca3af"
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
      
      <AgentInstanceContext.Provider value={{ addCanvasNode }}>
        <ReactFlow
          connectionMode={ConnectionMode.Loose}
          nodes={nodes}
          onNodesChange={onNodesChange}
          edges={edges}
          onEdgesChange={onEdgesChange}
          fitView
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={handleNodeClick}
          onSelectionChange={onSelectionChange}
          onConnectStart={handleConnectStart}
          onConnectEnd={handleConnectEnd}
          onPaneClick={handlePaneClick}
          nodeOrigin={[0.5, 0]}
          onEdgeMouseEnter={onEdgeMouseEnter}
          onEdgeMouseLeave={onEdgeMouseLeave}
          className="h-full"
          defaultEdgeOptions={{
            type: 'buttonEdge',
            markerEnd: 'logo',
            zIndex: 1001,
            style: { stroke: '#9ca3af', strokeWidth: 2 }, // 添加明显的样式
          }}
          deleteKeyCode={['Delete', 'Backspace']}
          proOptions={{ hideAttribution: true }}
        >
          <Controls
            position={'bottom-center'}
            orientation="horizontal"
            className="bg-white px-4 py-2 rounded-md shadow-lg"
          />
        </ReactFlow>

        {/* 节点选择面板 */}
        {showNodeSelector && connectionStart && (
          <HandleContext.Provider
            value={{
              nodeId: connectionStart.nodeId,
              id: connectionStart.handleId,
              type: 'source',
              position: Position.Right,
              isFromConnectionDrag: true,
            }}
          >
            <NodeSelectorPanel
              position={selectorPosition}
              onClose={() => {
                setShowNodeSelector(false)
                setConnectionStart(null)
              }}
              onNodeCreated={() => {
                setShowNodeSelector(false)
                setConnectionStart(null)
              }}
            />
          </HandleContext.Provider>
        )}
      </AgentInstanceContext.Provider>

      {/* 右侧属性编辑抽屉 */}
      <FormSheet
        open={showFormSheet}
        node={selectedNodeId ? getNode(selectedNodeId) : undefined}
        onClose={() => {
          setShowFormSheet(false)
          setSelectedNodeId(null)
        }}
      />
    </div>
  )
}


