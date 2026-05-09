import { createContext } from 'react'
import { Position } from '@xyflow/react'
import type { HandleType } from '@xyflow/react'

// Handle上下文类型
export type HandleContextType = {
  nodeId?: string
  id?: string
  type: HandleType
  position: Position
  isFromConnectionDrag: boolean
}

export const HandleContext = createContext<HandleContextType>({
  type: 'source',
  position: Position.Right,
  isFromConnectionDrag: false,
})

// Agent实例上下文（用于添加节点和管理表单）
export type AgentInstanceContextType = {
  addCanvasNode: (
    type: string,
    params: {
      nodeId?: string
      position: Position
      id?: string
      isFromConnectionDrag?: boolean
    },
  ) => (event?: { clientX: number; clientY: number }) => string | undefined
  showFormDrawer?: (e: React.MouseEvent<Element>, nodeId: string) => void
  lastNode?: string
  currentSendLoading?: boolean
  startButNotFinishedNodeIds?: string[]
  successNodeIds?: string[]
  errorNodeIds?: string[]
  nodeElapsedMap?: Record<string, number>
}

export const AgentInstanceContext = createContext<AgentInstanceContextType>({
  addCanvasNode: () => () => undefined,
  showFormDrawer: undefined,
})
