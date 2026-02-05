import { useShallow } from 'zustand/react/shallow'
import type { RFState } from '../store'
import useGraphStore from '../store'

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  setNodes: state.setNodes,
  onSelectionChange: state.onSelectionChange,
  onEdgeMouseEnter: state.onEdgeMouseEnter,
  onEdgeMouseLeave: state.onEdgeMouseLeave,
})

export const useSelectCanvasData = () => {
  return useGraphStore(useShallow(selector))
}
